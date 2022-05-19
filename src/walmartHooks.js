'use strict'
var _ = require('lodash')
var WalmartFulfillmentExportHooks = require('./hooks/fulfillmentHooks')
var WalmartOrderImportHooks = require('./hooks/orderHooks')
var WalmartItemExportHook = require('./hooks/itemHooks')
var eTailHelperUtil = require('connector-utils').installerUtils
var UtilSettings = require('connector-utils').Settings
var WALMART_CONSTANTS = require('./walmartConstants')
var logger = require('winston')

exports.walmartFulfillmentExportPreMapHook = function (options, callback) {
  logger.debug('walmartFulfillmentExportPostMapHook| options is:', JSON.stringify(options))

  var walmartSettings = options.settings
  var fulfillmentExportHooksInstance = null
  var preMapHookResponse = []

  _.each(options.data, function (preMapDataArray, index) {
    fulfillmentExportHooksInstance = new WalmartFulfillmentExportHooks(walmartSettings)
    preMapDataArray = fulfillmentExportHooksInstance.preMapProcessing(preMapDataArray)
    preMapHookResponse.push({'data': preMapDataArray})
  })
  logger.debug('walmartFulfillmentExportPostMapHook| preMapHookResponse is:', JSON.stringify(preMapHookResponse))
  return callback(null, preMapHookResponse)
}

exports.walmartOrderImportPreMapHook = function (options, callback) {
  logger.debug('walmartOrderImportPreMapHook | options:', JSON.stringify(options))

  var settings = new UtilSettings()
  var commonResources = settings.getStoreMap(options)
  var customerData = []
  var walmartOrderImportHooksInstance = new WalmartOrderImportHooks(options.settings)

  // creating seperate customer array for customer import adaptor
  _.each(options.data, function (orderJson, index) {
    customerData = walmartOrderImportHooksInstance.createCustomerArray(orderJson, customerData)
  })

  // invoking customer import adaptor
  var opts = {
    bearerToken: options.bearerToken,
    apiIdentifier: commonResources.apiIdentifierCustomerImport,
    data: customerData
  }
  var orderImportSettings = settings.getSettingsFromHercules(options)
  var defaultCustomerSettingKey = 'imports' + '_' + options._importId + '_' + WALMART_CONSTANTS.DEFAULT_CUSTOMER_SETTING_FIELD
  var defaultCustomerSettingValue = orderImportSettings[defaultCustomerSettingKey] || null

  if (!defaultCustomerSettingValue) {
    eTailHelperUtil.integratorApiIdentifierClient(opts, function (err, response, body) {
      if (err) return callback(err)
      return walmartOrderImportHooksInstance.customerImportCallback(err, response, body, options.data, callback)
    })
  } else {
    var orderImportHookResp = []

    _.each(options.data, function (orderJson, index) {
      orderJson['netSuiteCustomerId'] = parseInt(defaultCustomerSettingValue)
      orderImportHookResp.push({'data': orderJson})
    })
    return callback(null, orderImportHookResp)
  }
}

exports.walmartItemExportPreMapHook = function (options, callback) {
  logger.debug('walmartItemExportPreMapHook | options is:' + JSON.stringify(options))

  var _walmartItemExportHook = new WalmartItemExportHook()
  options.retryCount = 0
  _walmartItemExportHook.validateHttpConnection(options,function (err) {
    if (err) return callback(err)
    _walmartItemExportHook.processItemCategoryMappings(options, function (err, preMapData) {
      if (err) return callback(err)
      // preMapData : format - { errors : [], data : {}}

      logger.debug('processItemCategoryMappings callback | preMapData is:' + JSON.stringify(preMapData))

      var walmartItemExportHook
      _.each(preMapData, function (preMapDataNode, index) {
        try {
          walmartItemExportHook = new WalmartItemExportHook(options)
          if (preMapDataNode.data) {
            walmartItemExportHook.preMapProcessing(preMapDataNode.data)
          }
        } catch (ex) {
          logger.info('Error | walmartItemExportPreMapHook, Code:' + ex.name + ' Message:' + ex.message + '. StackTrace: ' + ex.stack)
          if (!preMapDataNode.errors) {
            preMapDataNode.errors = []
          }
          var sku = preMapDataNode.data && preMapDataNode.data['sku'] ? preMapDataNode.data['sku'] : '<>'
          preMapDataNode.errors.push({
            source: ex.source ? ex.source : 'adaptor',
            code: ex.name,
            message: 'Failed to process item with SKU# ' + sku + ' due to following error : ' + ex.message
          })
          delete preMapDataNode.data
        }
      })
      _walmartItemExportHook.itemProcessModeHandlingBeforeSubmit(options, preMapData, function (err) {
        if (err) {
          logger.info('itemProcessModeHandlingBeforeSubmit, error:' + JSON.stringify(err))
          _.each(preMapData, function (preMapDataNode) {
            if (!preMapDataNode.errors || !_.isArray(preMapDataNode.errors)) {
              preMapDataNode.errors = []
            }
            preMapDataNode.errors.push({code: err.name || 'ITEM_EXPORT_ERROR', message: err.message, source: err.source ? err.source : 'adaptor'})
            delete preMapDataNode.data
          })
        }
        logger.debug('walmartItemExportPreMapHook | preMapData response is:' + JSON.stringify(preMapData))
        return callback(null, preMapData)
      })
    })
  })
}
