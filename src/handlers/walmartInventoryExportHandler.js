'use strict'
var util = require('util')
  , AbstractHandler = require('abstract-connector').AbstractHandler
  , logger =  require('winston')
  , eTailUtil = require('abstract-connector').eTailUtil
  , _ = require('lodash')

function WalmartInventoryExportHandler () {
}

util.inherits(WalmartInventoryExportHandler, AbstractHandler)

WalmartInventoryExportHandler.prototype.beforeMakeRequestHook =  function (wrapper, transformedData, request, callback) {
  logger.debug('WalmartInventoryExportHandler, inside beforeMakeRequestHook transformedData: ' + JSON.stringify(transformedData))
  if(!transformedData)  return callback(null, transformedData, request)
 //to add namespaces
  transformedData = eTailUtil.addNamespaces(transformedData, 'wm')

  //to format inventory request xml
  var tagReplacementString = '<wm:inventory xmlns:wm="http://walmart.com/">'
  transformedData = transformedData.replace('<wm:inventory>', tagReplacementString)

  return callback(null, transformedData, request)
}

WalmartInventoryExportHandler.prototype.afterTransformationHook = function (wrapper, transformedResponse, callback) {
  logger.debug('WalmartInventoryExportHandler, inside afterTransformationHook transformedResponse: ' + JSON.stringify(transformedResponse))

  if(!!transformedResponse && transformedResponse.statusCode && transformedResponse.statusCode != 200) {
    _.each(transformedResponse.errors, function(error) {

      error.message = (error.message).replace('.,', ',')
      var sku = ''
      try {
        var preMapData = wrapper.getCurrentPreMapData()
        if(_.isArray(preMapData) && preMapData.length > 0)
          sku = preMapData[0]['SKU']
        else
          sku = preMapData['SKU']
      } catch (ex) {
        sku = null
      }
      error.message = 'Failed to update inventory for Item# ' + sku + ' : ' + error.message
    })
  }

  return callback(null, transformedResponse)
}

module.exports = WalmartInventoryExportHandler
