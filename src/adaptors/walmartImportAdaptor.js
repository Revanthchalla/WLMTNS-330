'use strict'

var _ = require('lodash')
  , request = require('request')
  , moment = require('moment')
  , CONSTS = require('../walmartConstants')
  , util = require('util')
  , AbstractImportAdaptor = require('abstract-connector').AbstractImportAdaptor
  , logger = require('winston')
  , walmartUtil = require('../util/walmartUtil')
  , handlebarsUtil = require('../util/handlebarsUtil') //require('abstract-connector').handlebarsUtil
  , eTailUtil = require('abstract-connector').eTailUtil

function WalmartImportAdaptor () {
}

util.inherits(WalmartImportAdaptor, AbstractImportAdaptor)

WalmartImportAdaptor.prototype.prepareRequest = function (wrapper, data, callback) {
  var options = wrapper.getOptions()
  logger.debug('WalmartImportAdaptor, inside prepareAndSignRequest options.configuration: ' + JSON.stringify(options.configuration))

  if(!options.connection || !options.connection.unencrypted || !options.connection.encrypted)
    return callback(new Error('Cannot prepare HTTP request options for Walmart, Cannot find connection details in Integrator options'))

  var config = wrapper.getConfig()
  , consumerId = options.connection.unencrypted.walmartConsumerId
  , consumerChannelType = null
  , url = CONSTS.WALMART_BASE_URL + config.apiVersion + config.relativePath
  , requestMethod = config.method ? config.method.toUpperCase() : 'POST'
  , unixTimeStamp = moment().format('x')
  , preMapData = wrapper.getCurrentPreMapData()
  , clientId = options.connection.unencrypted.clientId
  , clientSecret = options.connection.encrypted.clientSecret

  logger.debug('WalmartImportAdaptor, inside prepareAndSignRequest preMapData: ' + JSON.stringify(preMapData))
  handlebarsUtil.processString(url, preMapData, function (err, url) {
    if(err) return callback(err)

    url = replaceSpaceCharacters(url)

    logger.debug('WalmartImportAdaptor, inside prepareAndSignRequest, processString callback, url: ' + url)

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
      requestOptions.gzip = true
      return callback(null, requestOptions)
    } else {
      try {
        var retryCount = 0
        walmartUtil.getAccessToken(clientId, clientSecret, unixTimeStamp, retryCount, function(err, accessTokenResponse) {
          if(err) {
            return callback(new Error('Unable to make call to Token API for import=' + options._importId + '. Error=' + err))
          }
  
          requestOptions = walmartUtil.addHeaders(requestOptions, unixTimeStamp, accessTokenResponse)
          requestOptions.gzip = true
          return callback(null, requestOptions)
        })
      } catch(ex) {
        return callback(new Error('Unable to make call to Token API for import=' + options._importId + '. Code=' + ex.code + ', Message=' + ex.message))
      }
    } 
  })
}

function replaceSpaceCharacters (url) {
  if(!url || url.indexOf(' ') < 0) return url
  return url.replace(/\s/g,'%20')
}

WalmartImportAdaptor.prototype.makeRequest = function (wrapper, requestOptions, callback) {
  if(!requestOptions) return callback(new Error('Not able to make request, Empty requestOptions'))
  var options = wrapper.getOptions()
  , acceptableErrorCodes = wrapper.getAcceptableErrorCodes()

  logger.debug('WalmartImportAdaptor, inside makeRequest requestOptions: ' + JSON.stringify(requestOptions))
  request(requestOptions, function(err, res, body) {
    if(err) {
      logger.info('WalmartImportAdaptor, inside makeRequest err: ' + err)
      return callback(err)
    }
    return callback(null, res, body)
  })
}

WalmartImportAdaptor.prototype.beforeResponseTransformation = function (wrapper, body, callback) {
  logger.debug('WalmartImportAdaptor, inside beforeResponseTransformation body: ' + body)
  if(!body) return callback(null, body)
  var namespacePatternArray = []
  namespacePatternArray.push(/ns\d+:/g)
  namespacePatternArray.push(/ns\d+/g)
  /*namespacePatternArray.push(/ns2:/g)
  namespacePatternArray.push(/ns3:/g)
  namespacePatternArray.push(/ns4:/g)
  namespacePatternArray.push(/ns2/g)
  namespacePatternArray.push(/ns3/g)
  namespacePatternArray.push(/ns4/g)*/
  logger.debug('WalmartImportAdaptor, inside beforeResponseTransformation, namespacePatternArray: ' + namespacePatternArray)
  var processedBody = eTailUtil.removeNamespaces(namespacePatternArray, body)
  return callback(null, processedBody)
}

WalmartImportAdaptor.prototype.handleFatalRequestError = function (wrapper, err, callback) {
  logger.debug('WalmartImportAdaptor, inside handleFatalRequestError')
  if(!err) return callback(null, err)
  var response = {
    statusCode : 422,
    id : null,
    ignored : false,
    errors : [{code : 'UNABLE_TO_IMPORT_DATA', message : 'Unable to import data due to following error : ' + err.code + ', ' + err.message}]
  }
  return callback(null, response)
}

WalmartImportAdaptor.prototype.afterResponseTransformation = function (wrapper, transformedResponse, callback) {
  logger.debug('WalmartImportAdaptor, inside afterResponseTransformation, transformedResponse : ' + JSON.stringify(transformedResponse))
  //TODO : Code to remove namespaces from transformedResponse
  var statusCode = wrapper.getWrapperResponseStatusCode()
  if(statusCode >= 200 && statusCode < 300)  return callback(null, {statusCode : statusCode, errors : [], id : null, ignored : false})

  var handler = wrapper.getHandler()
  , code = 'WALMART_IMPORT_ERROR'
  , source = 'WALMART '

  if(handler && typeof handler.getErrorCodeString === 'function') {
    code = handler.getErrorCodeString()
  }

  var resErrors = []
  , response = {}

  try {
    if(transformedResponse.errors && transformedResponse.errors.error && !_.isArray(transformedResponse.errors.error)) {
      var resError =
        { source : source + (transformedResponse.errors.error.category || 'DEFAULT')
        , code : code
        , message : (transformedResponse.errors.error.info || 'INFO NOT AVAILABLE') + ', ' + (transformedResponse.errors.error.description || 'DESCRIPTION NOT AVAILABLE')
        }
      resErrors.push(resError)
    } else if (transformedResponse.errors && transformedResponse.errors.error && _.isArray(transformedResponse.errors.error)) {
      _.each(transformedResponse.errors.error, function (error) {
        var resError =
          { source : source + (error.category || 'DEFAULT')
          , code : code
          , message : (error.info || 'INFO NOT AVAILABLE') + ', ' + (error.description || 'DESCRIPTION NOT AVAILABLE')
          }
          if (error.info === error.description) {
            resError.message = (error.info || 'INFO NOT AVAILABLE')
          }
        resErrors.push(resError)
      })
    }
  } catch (ex) {
    logger.info('WalmartImportAdaptor, inside afterResponseTransformation, exception in parsing error transformedResponse, ex : ' + JSON.stringify(ex))
    resErrors.push({code: code, message : 'Unable to parse response from Walmart. Response : ' + wrapper.getWrapperResponseStatusCode() + ', ' + JSON.stringify(transformedResponse) })
  }

  response =
    { statusCode : statusCode
    , errors : resErrors
    , id : null
    , ignored : false
    }

  logger.debug('WalmartImportAdaptor, inside afterResponseTransformation, response : ' + JSON.stringify(response))
  return callback(null, response)
}

module.exports = WalmartImportAdaptor
