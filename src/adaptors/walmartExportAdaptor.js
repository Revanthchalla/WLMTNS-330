'use strict'

var _ = require('lodash')
  , moment = require('moment')
  , CONSTS = require('../walmartConstants')
  , util = require('util')
  , AbstractExportAdaptor = require('abstract-connector').AbstractExportAdaptor
  , logger = require('winston')
  , walmartUtil = require('../util/walmartUtil')

function WalmartExportAdaptor () {
}

util.inherits(WalmartExportAdaptor, AbstractExportAdaptor)

WalmartExportAdaptor.prototype.prepareRequest = function (wrapper, data, callback) {
  var options = wrapper.getOptions()
  , config = wrapper.getConfig()

  logger.debug('WalmartExportAdaptor, inside prepareRequest config: ' + JSON.stringify(config))

  if(!options.connection || !options.connection.unencrypted || !options.connection.encrypted)
    return callback(new Error('Cannot prepare HTTP request options for Walmart, Cannot find connection details in Integrator options'))

  var url = CONSTS.WALMART_BASE_URL + config.apiVersion + config.relativePath
  , consumerId = options.connection.unencrypted.walmartConsumerId
  , consumerChannelType = null
  , requestMethod = config.method ? config.method.toUpperCase() : 'GET'
  , unixTimeStamp = moment().format('x')
  , lastExecutionTime = wrapper.getLastExecutionTime()
  , nextCursor = wrapper.getCache().nextCursor || null
  , nowMoment = null
  , oldMoment = null
  , state = wrapper.getCache() || {}
  , startDateTime = ''
  , clientId = options.connection.unencrypted.clientId
  , clientSecret = options.connection.encrypted.clientSecret

  if(nextCursor) {
    //Will serve in cases of both delta, on demand order import and all.
    logger.debug('WalmartExportAdaptor, inside prepareRequest, nextCursor exists : ' + nextCursor )
    url += nextCursor
    if(!!config.onDemandOrderIds)
      state.currentRecordId = nextCursor
    wrapper.setCache(state)
  } else if (options.delta) {
    var lastExecutionDateTime = new Date(lastExecutionTime)
    lastExecutionDateTime = lastExecutionDateTime.toISOString()

    url += '?' + options.delta.dateField + '=' + lastExecutionDateTime + '&limit=' + config.pageSizeLimit
    logger.debug('WalmartExportAdaptor, inside prepareRequest, delta run url : ' + url )
	} else if (options.test) {
		nowMoment = moment()
		oldMoment = nowMoment.subtract(1, 'month')
		oldMoment = oldMoment.format('YYYY-MM-DD')

		url += '?createdStartDate=' + oldMoment
    logger.debug('WalmartExportAdaptor, inside prepareRequest, test run url : ' + url )
	} else {
    //type is "all"
    try {
      if(config.dateField && !!config[config.dateField]) {
        startDateTime = new Date(config[config.dateField])
        startDateTime = startDateTime.toISOString()
      } else {
        nowMoment = moment()
        startDateTime = nowMoment.subtract(1, 'day')
        startDateTime = startDateTime.format('YYYY-MM-DD')
      }
    } catch (ex) {
      return callback(new Error('Cannot prepare HTTP request options for Walmart, code : ' + ex.code + ', message : ' + ex.message))
    }

    if(!!config.dateField) {
      url += '?' + config.dateField + '=' + startDateTime
    }

    if(!!config.pageSizeLimit) {
      url += '&limit=' + config.pageSizeLimit
    }

    if(!!config.onDemandOrderIds && config.onDemandOrderIds.length > 0) {
      logger.info('WalmartExportAdaptor, inside prepareRequest, all run, config.onDemandOrderIds : ' + config.onDemandOrderIds)
      //To be executed only for the first order in the onDemandOrderIds list.
      //Ideally, flow specific code for URL modifications should be in handlers, but walmart does not allow change in URLs after signature generation
      url += config.onDemandOrderIds[0]
      state.currentRecordId = config.onDemandOrderIds[0]
      if(config.onDemandOrderIds.length > 1) {
        config.onDemandOrderIds.shift()
        state.onDemandOrderIds = config.onDemandOrderIds
      }
      logger.debug('WalmartExportAdaptor, inside prepareRequest, all run, setting state : ' + JSON.stringify(state))
      wrapper.setCache(state)
    }

    logger.debug('WalmartExportAdaptor, inside prepareRequest, all run url : ' + url )
  }

  var requestOptions =
  { uri : url
  , method : config.method
  , headers : config.headers
  }
        
  //Remove if logic after Aug 28,2019 - WLMTNS-216
  if(consumerId) {
    var input = [consumerId, url, requestMethod, unixTimeStamp].join('\n') + "\n"

    try {
      var signature = walmartUtil.signRequest(options.connection.encrypted.privateKey, input)
      if(!signature)  throw new Error('Signature returned as null from walmartUtil.signRequest')
    } catch (ex) {
      return callback(new Error('Unable to generate signature for the request : Code : ' + ex.code + ', Message : ' + ex.message))
    }

    if(config.apiVersion === CONSTS.V3_API_VERSION_IDENTIFIER) {
      if(!options.connection.unencrypted.consumerChannelType)
        return callback(new Error('Connection Encrypted info should contain consumerChannelType for the API Version : ' + config.apiVersion))
      consumerChannelType = options.connection.unencrypted.consumerChannelType
    }

    requestOptions = walmartUtil.addHeaders(requestOptions, unixTimeStamp, {signature: signature, consumerId: consumerId, consumerChannelType: consumerChannelType})
    return callback(null, requestOptions)
  } else {
    try {
      var retryCount = 0
      walmartUtil.getAccessToken(clientId, clientSecret, unixTimeStamp, retryCount, function(err, accessTokenResponse) {
        if(err) {
          return callback(new Error('Unable to make call to Token API for export=' + options._exportId + '. Error=' + err))
        }
        
        requestOptions = walmartUtil.addHeaders(requestOptions, unixTimeStamp, accessTokenResponse)
        return callback(null, requestOptions)
      })
    } catch(ex) {
      return callback(new Error('Unable to make call to Token API for export=' + options._exportId + '. Code=' + ex.code + ', Message=' + ex.message))
    }
  }
}

WalmartExportAdaptor.prototype.handleFatalRequestError = function (wrapper, err, callback) {
  logger.debug('WalmartExportAdaptor, inside handleFatalRequestError')
  if(!err) return callback(null, err)
  var response =
    { data : []
    , errors : [{source: 'WALMART', code : 'UNABLE_TO_EXPORT_DATA', message : 'Unable to export data due to following error : ' + err.code + ', ' + err.message}]
    }
  return callback(null, response)
}

WalmartExportAdaptor.prototype.pagingActionBeforeResponseReturn = function (wrapper, walmartResponse, callback) {

  var options = wrapper.getOptions()
  , config = wrapper.getConfig()
  logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn options: ' + JSON.stringify(options))
  var isLastPage = wrapper.getIsLastPage()
  logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn isLastPage before : ' + isLastPage)

  if(!walmartResponse) {
    logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn, empty walmartResponse, setting isLastPage true ')
    wrapper.setIsLastPage(true)
    wrapper.setCache({})
    return callback(null, walmartResponse)
  }

  if(wrapper.getIsPreviewCall()) {
      logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn, it is a preview call, setting isLastPage true ')
      wrapper.setIsLastPage(true)
      wrapper.setCache(null)
      return callback(null, walmartResponse)
  }

  var state = wrapper.getCache() || {}

  if(!!walmartResponse.list && !!walmartResponse.list.meta && walmartResponse.list.meta.nextCursor  && (walmartResponse.list.meta.nextCursor).indexOf('hasMoreElements=true') != -1) {
    state.nextCursor = walmartResponse.list.meta.nextCursor
    wrapper.setCache(state)
    logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn, setting isLastPage false')
    wrapper.setIsLastPage(false)
  } else {
    logger.debug('WalmartExportAdaptor, inside pagingActionBeforeResponseReturn, setting isLastPage true')
    state.nextCursor = null
    wrapper.setCache(state)
    wrapper.setIsLastPage(true)
  }

  return callback(null, walmartResponse)
}

module.exports = WalmartExportAdaptor
