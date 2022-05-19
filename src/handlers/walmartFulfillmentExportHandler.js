'use strict'
var util = require('util')
  , AbstractHandler = require('abstract-connector').AbstractHandler
  , logger = require('winston')
  , eTailUtil = require('abstract-connector').eTailUtil
  , _ = require('lodash')
  , CONSTS = require('../walmartConstants')
  , Settings = require('connector-utils').Settings

function WalmartFulfillmentExportHandler () {
  this.shipMethodLabel = 'Ship Method'
  this.eTailOrderIdLabel = 'eTail Order Id'
}

util.inherits(WalmartFulfillmentExportHandler, AbstractHandler)

WalmartFulfillmentExportHandler.prototype.beforePrepareRequestHook = function (wrapper, data, callback) {
  logger.debug('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook data: ' + JSON.stringify(data))
  logger.debug('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook preMapData: ' + JSON.stringify(wrapper.getCurrentPreMapData()))
  var settingsObj = new Settings()
  , fulfillmentSettings = settingsObj.getSettingsFromHercules(wrapper.getOptions())
  , isAutoCarrierLookupEnabled = _.find(fulfillmentSettings, function (v,k) {
    if(k.indexOf('autoCarrierLookupEnabled') !== -1)  return true
  }) || false
  , invalidCarrierOrderArray = []

  logger.debug('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook , isAutoCarrierLookupEnabled: ' + isAutoCarrierLookupEnabled)

  if(!data) return callback(null, data)

  try {
    if(data && data.orderShipment && data.orderShipment.orderLines && _.isArray(data.orderShipment.orderLines.orderLine)) {
      _.each(data.orderShipment.orderLines.orderLine, function (orderLineNode, index) {

        if(isAutoCarrierLookupEnabled && orderLineNode && orderLineNode.orderLineStatuses && orderLineNode.orderLineStatuses.orderLineStatus && orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo && orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName && orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName.carrier) {
          orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName.carrier = _.find(CONSTS.WALMART_VALID_FULFILLMENT_CARRIER_NAMES, function(walmartCarrierName, index) {
  				  return (orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName.carrier.toLowerCase().indexOf(walmartCarrierName.toLowerCase()) !== -1)
  		    }) || null
        }

        logger.debug('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook, carrierName: ' + JSON.stringify(orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName))

        if(!orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName || (!orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName.carrier && !orderLineNode.orderLineStatuses.orderLineStatus.trackingInfo.carrierName.otherCarrier)) {
          invalidCarrierOrderArray.push(wrapper.getCurrentPreMapData()[index]["Shipping Carrier"])
        }
      })
    }
    logger.debug('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook, returning data: ' + JSON.stringify(data))
    if(!_.isEmpty(invalidCarrierOrderArray)) {
      logger.info('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook, Unable to find valid Walmart Fulfillment Carrier for order# ' + wrapper.getCurrentPreMapData()[0]["eTail Order Id"] + '. Invalid Carriers provided : ' + invalidCarrierOrderArray.join(', ') + '. Please add valid Carrier to fulfill the orders.')
      return callback(new Error('Unable to find valid Walmart Fulfillment Carrier for order# ' + wrapper.getCurrentPreMapData()[0]["eTail Order Id"] + '. Invalid Carriers provided : ' + invalidCarrierOrderArray.join(', ') + '. Please add valid Carrier to fulfill the orders.'))
    }
    return callback(null, data)
  } catch (ex) {
    logger.info('WalmartFulfillmentExportHandler, inside beforePrepareRequestHook, ex: ', ex)
    return callback(new Error('Unable to submit Fulfillment due to following error : ' + ex.message))
  }
}

WalmartFulfillmentExportHandler.prototype.beforeMakeRequestHook =  function (wrapper, transformedData, requestOptions, callback) {
  if(!transformedData)  return callback(null, transformedData, requestOptions)
  //to add namespaces
  transformedData = eTailUtil.addNamespaces(transformedData, 'ns2')
  var tagReplacementString

  //to format the data
  try {
    var config = wrapper.getConfig()
    if(config.apiVersion === 'v2')
      tagReplacementString = '<ns2:orderShipment xmlns:ns2="http://walmart.com/mp/orders" xmlns:ns3="http://walmart.com/">'
    else
      tagReplacementString = '<ns2:orderShipment xmlns:ns2="http://walmart.com/mp/v3/orders" xmlns:ns3="http://walmart.com/">'
  } catch(ex) {
    logger.info('WalmartFulfillmentExportHandler, beforeMakeRequestHook ex : ', ex.message)
    tagReplacementString = '<ns2:orderShipment xmlns:ns2="http://walmart.com/mp/v3/orders" xmlns:ns3="http://walmart.com/">'
  }

  transformedData = transformedData.replace('<ns2:orderShipment>', tagReplacementString)
  return callback(null, transformedData, requestOptions)
}

WalmartFulfillmentExportHandler.prototype.afterTransformationHook = function (wrapper, transformedResponse, callback) {
  var self = this
  logger.debug('WalmartFulfillmentExportHandler, inside afterTransformationHook transformedResponse: ' + JSON.stringify(transformedResponse))

  if(!!transformedResponse && transformedResponse.statusCode && transformedResponse.statusCode != 200) {
    _.each(transformedResponse.errors, function(error) {

      error.message = (error.message).replace('.,', ',')
      var orderId = ''
      try {
        orderId = (wrapper.getCurrentPreMapData())[0][self.eTailOrderIdLabel]
      } catch (ex) {
        orderId = null
      }
      error.message = 'Failed to export fulfillment for Walmart Order# ' + orderId + ' : ' + error.message
    })
  }

  return callback(null, transformedResponse)
}

module.exports = WalmartFulfillmentExportHandler
