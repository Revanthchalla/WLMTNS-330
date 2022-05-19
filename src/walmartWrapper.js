'use strict'
var AbstractWrapper = require('abstract-connector').AbstractWrapper
, util = require('util')
, logger = require('winston')

, WalmartOrderImportHandler = require('./handlers/walmartOrderImportHandler')
, WalmartPricingExportHandler = require('./handlers/walmartPricingExportHandler')
, WalmartOrderAcknowledgementExportHandler = require('./handlers/walmartOrderAcknowledgementExportHandler')
, WalmartInventoryExportHandler = require('./handlers/walmartInventoryExportHandler')
, WalmartFulfillmentExportHandler = require('./handlers/walmartFulfillmentExportHandler')

, WalmartExportAdaptor = require('./adaptors/walmartExportAdaptor')
, WalmartImportAdaptor = require('./adaptors/walmartImportAdaptor')

function WalmartWrapper() {
  logger.debug('WalmartWrapper, constructor')
}

util.inherits(WalmartWrapper, AbstractWrapper)

WalmartWrapper.prototype.getRegisteredAdaptors = function (options, callback) {
  logger.debug('WalmartWrapper, getRegisteredAdaptors, options : ' + JSON.stringify(options))
  var adaptorMap =
    [ { name : 'WalmartExportAdaptor' , classRef : WalmartExportAdaptor}
    , { name : 'WalmartImportAdaptor' , classRef : WalmartImportAdaptor}
    ]
  return callback(null, adaptorMap)
}

WalmartWrapper.prototype.setPingConfig =  function (options) {

  options.configuration = {
      "method": "GET",
      "apiVersion": "v3",
      "removeDataFromRequest" : true,
      "pageSizeLimit" : 1,
      "relativePath": "/orders/released/",
      "resourceType": "export",
      "applicationAdaptor": "WalmartExportAdaptor",
      "handler": "WalmartOrderImportHandler",
      "headers": {
          "Accept": "application/xml"
      },
      "acceptableErrorCodes": [404, 403, 206, 429, 500, 503, 504, 520, 521]
  }

  options.test = {
                  "limit": 1
                 }
}

WalmartWrapper.prototype.getRegisteredHandlers = function (options, callback) {
  logger.debug('WalmartWrapper, getRegisteredHandlers, options : ' + JSON.stringify(options))
  var handlerMap =
    [ { name : 'WalmartOrderImportHandler' , classRef : WalmartOrderImportHandler}
    , { name : 'WalmartPricingExportHandler' , classRef : WalmartPricingExportHandler}
    , { name : 'WalmartOrderAcknowledgementExportHandler' , classRef : WalmartOrderAcknowledgementExportHandler}
    , { name : 'WalmartInventoryExportHandler' , classRef : WalmartInventoryExportHandler}
    , { name : 'WalmartFulfillmentExportHandler' , classRef : WalmartFulfillmentExportHandler}
    ]
  return callback(null, handlerMap)
}

module.exports = WalmartWrapper
