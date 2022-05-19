'use strict'

var _ = require('lodash')
var logger = require('winston')
var WalmartItemCategoryHandlerClass = require('../handlers/walmartItemCategoryHandler')
var Settings = require('connector-utils').Settings
var async = require('async')
var installerUtils = require('connector-utils').installerUtils
var maxRetry = 5
var retryTimingSlot = [10000, 20000, 30000, 30000, 30000]

function WalmartItemExportHook (walmartItemSettings) {
  this.walmartItemSettings = walmartItemSettings
  this.WALMART_PRODUCT_ID_TYPE_PREFERENCE = ['ISBN', 'UPC', 'GTIN', 'EAN']
  //this.productIdTypeLabel = 'productIdType_1'
  //this.productIdLabel = 'productId_1'
  this.productIdentifier = 'productIdentifier'
  this.categoryIdLabel = 'Category Id'
  this.rootCategoryIdLabel = 'Root Category Id'
  this.productNameLabel = 'productName'
  this.shortDescriptionLabel = 'shortDescription'
  this.brandLabel = 'brand'
  this.mainImageUrlLabel = 'mainImageUrl'
  this.priceLabel = 'price'
  this.shippingWeightMeasureLabel = 'ShippingWeight.measure'
  this.shippingWeightUnitLabel = 'ShippingWeight.unit'
  this.productTaxCodeLabel = 'ProductTaxCode'
  this.processModeLabel = 'processMode'
  this.skuLabel = 'sku'
  this.replaceOfferLabel = 'Replace Offer'
  this.CREATE_MODE = 'CREATE'
  this.PARTIAL_UPDATE = 'PARTIAL_UPDATE'
  this.REPLACE_ALL = 'REPLACE_ALL'
}

WalmartItemExportHook.prototype.preMapProcessing = function (preMapDataNode) {
  var that = this
  that.processProductId(preMapDataNode)
  that.splitCategoryId(preMapDataNode)
  that.validateMandatoryFields(preMapDataNode)
  that.validateMandatoryVariationFields(preMapDataNode)
  that.formatVariationNamesArray(preMapDataNode)
  that.processVariationMappings(preMapDataNode)
  that.addProductOfferNodes(preMapDataNode)
  logger.debug('WalmartItemExportHook, preMapProcessing, preMapDataNode after processing : ', JSON.stringify(preMapDataNode))
}

var validateHttpConnection  = WalmartItemExportHook.prototype.validateHttpConnection = function (options, callback) {
  var settings = new Settings()
  var retryCount = options.retryCount
  var storeMap = settings.getStoreMap(options, null)

  if (!storeMap || !storeMap.walmartHttpConnectionId) {
    return callback(new Error('Walmart HTTP connection id not found. Please contact Celigo support.'))
  }

  installerUtils.integratorRestClient({
    bearerToken: options.bearerToken,
    resourcetype: 'connections',
    id: storeMap.walmartHttpConnectionId + '/ping',
    retry: false
  }, function (err, response, body) {

    if (response && response.statusCode == '401') {
      return callback(new Error('The Walmart HTTP Connection is offline. Please re-enter the connection credentials before running this flow. For more information, <a href="https://celigosuccess.zendesk.com/hc/en-us/articles/360003868652#docout-2" target="_blank">click here</a>\''))
    }

    if ((body && body.errors || err) && (retryCount < maxRetry)) {
      retryCount++
      options.retryCount = retryCount
      return setTimeout(validateHttpConnection, retryTimingSlot[retryCount], options, callback)
    }
    else if(retryCount >= maxRetry) {
      return callback(new Error('Unable to ping Walmart HTTP connection. Please contact Celigo support.'))
    }

    return callback(null, body)
  })
}

WalmartItemExportHook.prototype.processProductId = function (preMapDataNode) {
  var that = this
  var count = 1
  preMapDataNode[that.productIdentifier] = {}
  _.forEach(that.WALMART_PRODUCT_ID_TYPE_PREFERENCE, function (productIdType) {
    if (preMapDataNode.hasOwnProperty(productIdType) && !!preMapDataNode[productIdType]) {
      preMapDataNode[that.productIdentifier][count++] = {
        productIdType: productIdType,
        productId: preMapDataNode[productIdType]
      }
      delete preMapDataNode[productIdType]
    }
  })
  // if no productIdentifiers found delete the empty entry
  if(_.isEmpty(preMapDataNode[that.productIdentifier])) delete preMapDataNode[that.productIdentifier]
}

WalmartItemExportHook.prototype.splitCategoryId = function (preMapDataNode) {
  var that = this
  try {
    if (preMapDataNode && preMapDataNode[that.categoryIdLabel] && preMapDataNode[that.categoryIdLabel].indexOf('.') !== -1) {
      var labels = preMapDataNode[that.categoryIdLabel].split('.')
      preMapDataNode[that.categoryIdLabel] = labels[1]
    }
  } catch (ex) {
    logger.info('WalmartItemExportHook, splitCategoryId, Exception message : ' + ex.message + '. StackTrace: ' + ex.stack)
    throw (ex)
  }
}

WalmartItemExportHook.prototype.validateMandatoryFields = function (preMapDataNode) {
  var that = this
  var missingFields = []
  var mandatoryFields = [
    that.skuLabel, that.processModeLabel, that.replaceOfferLabel, that.productIdentifier, that.categoryIdLabel, that.rootCategoryIdLabel, that.productNameLabel, that.shortDescriptionLabel, that.brandLabel, that.mainImageUrlLabel
  ]
  // Template 3.2, offer fields are no longer mandatory
  var mandatoryOfferFields = [] // [ that.priceLabel, that.shippingWeightMeasureLabel, that.shippingWeightUnitLabel, that.productTaxCodeLabel ]
  var validProcessModes = ['CREATE', 'REPLACE_ALL', 'PARTIAL_UPDATE']

  if (preMapDataNode && preMapDataNode[that.processModeLabel] && validProcessModes.indexOf(preMapDataNode[that.processModeLabel]) === -1) {
    throw ({source: 'adaptor', name: 'ITEM_EXPORT_ERROR', message: 'Invalid process mode. The process mode can only be one of ' + validProcessModes.join(', ')})
  }

  try {
    _.forEach(mandatoryFields, function (field) {
      if (!preMapDataNode.hasOwnProperty(field) || preMapDataNode[field] === null || preMapDataNode[field] === '') {
        missingFields.push(field)
      }
    })
    if (!_.isEmpty(missingFields)) {
      var errorMessage = 'Missing mandatory fields# ' + missingFields.join(', ')
      throw ({source: 'adaptor', name: 'ITEM_EXPORT_ERROR', message: errorMessage})
    }
  } catch (ex) {
    logger.info('WalmartItemExportHook, validateMandatoryFields, Exception message : ' + ex.message)
    throw (ex)
  }
}

WalmartItemExportHook.prototype.addProductOfferNodes = function (preMapDataNode) {
  var that = this
  if (preMapDataNode[that.processModeLabel] === that.CREATE_MODE || preMapDataNode[that.processModeLabel] === that.PARTIAL_UPDATE || (preMapDataNode[that.processModeLabel] === that.REPLACE_ALL)) {
    preMapDataNode.addProduct = true 
  }
  if (preMapDataNode[that.processModeLabel] === that.CREATE_MODE || (preMapDataNode[that.processModeLabel] === that.REPLACE_ALL && preMapDataNode[that.replaceOfferLabel])) {
    preMapDataNode.addOffer = true
  }
}

WalmartItemExportHook.prototype.validateMandatoryVariationFields = function (preMapDataNode) {
  // either all mandatory variation fileds should be present or none should be present
  if (preMapDataNode.variantGroupId && preMapDataNode.variantAttributeNames && preMapDataNode.isPrimaryVariant) return
  if (!preMapDataNode.variantGroupId && !preMapDataNode.variantAttributeNames && (!preMapDataNode.isPrimaryVariant || preMapDataNode.isPrimaryVariant === 'No')) {
    preMapDataNode.isPrimaryVariant = ''
    return
  }
  var message = JSON.stringify({isPrimaryVariant: preMapDataNode.isPrimaryVariant, variantGroupId: preMapDataNode.variantGroupId, variantAttributeNames: preMapDataNode.variantAttributeNames})
  throw new Error('Missing one or more of isPrimaryVariant, variantGroupId or variantAttributeNames, data=' + message)
}

// variantAttributeNames is a comma separated string containg variation attributes
// Splitting them up here to be used up in handlebar later
WalmartItemExportHook.prototype.formatVariationNamesArray = function (preMapDataNode) {
  var variantAttributeNames = preMapDataNode.variantAttributeNames
  var variantAttributeList = []
  if (variantAttributeNames) {
    variantAttributeList = variantAttributeNames.split(',')
    preMapDataNode.variantAttributeNames = variantAttributeList
  }
}

// extract out the variations present in variationAttributes and fill them in preMapDataNode
WalmartItemExportHook.prototype.processVariationMappings = function (preMapDataNode) {
  var that = this
  try {
    // variationAttributesKey = variation_variationAttribute
    var walmartItemCategoryHandler = new WalmartItemCategoryHandlerClass({options: that.walmartItemSettings})
    var variationAttributesKey = walmartItemCategoryHandler.getVariationMappingPrefix() + walmartItemCategoryHandler.getVariationAttributeIdentifierKey()
    // example: variationAttributes = { color : 'red', size: 'X/S' }
    if(preMapDataNode && preMapDataNode[variationAttributesKey])
      var variationAttributes = preMapDataNode[variationAttributesKey]
    if (!variationAttributes || _.isEmpty(variationAttributes)) return
    _.each(variationAttributes, function (value, key) {
      preMapDataNode[key] = value
    })
    delete preMapDataNode[variationAttributesKey]
  } catch (ex) {
    logger.info('module=itemHooks function=processVariationMappings error=' + ex.message)
    throw ex
  }
}

// This function changes the process mode of the item to PARTIAL_UPDATE if the item
// already exists on the Walmart and updates the same in Netsuite
WalmartItemExportHook.prototype.itemProcessModeHandlingBeforeSubmit = function (options, preMapData, callback) {
  var that = this
  var itemStatusToBeUpdated = []
  var settings = new Settings()
  var storeMap = settings.getStoreMap(options, null)

  logger.debug('itemProcessModeHandlingBeforeSubmit | preMapdata: ' + JSON.stringify(preMapData))

  // For each sku make calls to Walmart to check if the item exists.
  async.eachLimit(preMapData, 20, function (preMapDataNode, asyncCallback) {
    if (!preMapDataNode || !preMapDataNode.data || !preMapDataNode.data.sku) return asyncCallback()
    if (preMapDataNode.data[that.processModeLabel] !== that.CREATE_MODE) return asyncCallback()

    var opts = {
      bearerToken: options.bearerToken,
      apiIdentifier: storeMap.apiIdentifierSingleItemExportAdaptor,
      // replace white spaces with '+' so that api call works
      data: {'sku': preMapDataNode.data[that.skuLabel].replace(/ /g, '+')}
    }
    logger.debug('WalmartItemPreMapHook | itemProcessModeHandlingBeforeSubmit, Invoking get item export adaptor, opts: ', JSON.stringify(opts))

    installerUtils.integratorApiIdentifierClient(opts, function (err, response, body) {
      logger.debug('itemProcessModeHandlingBeforeSubmit | integratorApiIdentifierClient, response: ' + JSON.stringify(response))
      if (err) {
        // TODO: remove SYSTEM_ERROR.GMP_ITEM_QUERY_API once it gets resolved from Walmart side
        if (body && body.errors && _.isArray(body.errors) && ((body.errors[0].code === 404 && body.errors[0].message === 'CONTENT_NOT_FOUND.GMP_ITEM_QUERY_API') || (body.errors[0].code === 500 && body.errors[0].message === 'SYSTEM_ERROR.GMP_ITEM_QUERY_API'))) {
          return asyncCallback()
        }
        // logger.info('itemProcessModeHandlingBeforeSubmit | integratorApiIdentifierClient, error: ' + JSON.stringify(err))
        if (!preMapDataNode.errors) preMapDataNode.errors = []
        preMapDataNode.errors.push({
          source: 'adaptor',
          code: 'ITEM_FETCH_FAILED',
          message: 'Unable to fetch the publish status for sku# ' + preMapDataNode.data[that.skuLabel] + ' due to error:' + JSON.stringify(err)
        })
        delete preMapDataNode.data
        return asyncCallback()
      } else if (body && body.data && _.isArray(body.data) && !_.isEmpty(body.data)) {
        preMapDataNode.data[that.processModeLabel] = 'PARTIAL_UPDATE'
        preMapDataNode.data['ingestionStatus'] = 'SUCCESS'
        delete preMapDataNode.data.addOffer
        itemStatusToBeUpdated.push(preMapDataNode.data)
      } else {
        preMapDataNode.errors = [{ source: 'adaptor', code: 'ITEM_FETCH_FAILED', message: 'Unable to fetch the publish status for sku# ' + preMapDataNode.data[that.skuLabel] + '. Please retry, if error persists kindly contact Celigo Support.' }]
        delete preMapDataNode.data
        logger.info('WalmartItemPreMapHook | itemProcessModeHandlingBeforeSubmit, Error: ' + JSON.stringify(preMapDataNode.errors) + ', Response:' + JSON.stringify(response))
      }
      return asyncCallback()
    })
  }, function (err) {
    if (err) {
      logger.info('itemProcessModeHandlingBeforeSubmit, final callback error: ' + JSON.stringify(err))
      return callback(err)
    }

    var opts = {
      bearerToken: options.bearerToken,
      apiIdentifier: storeMap.apiIdentifierItemStatusImportAdaptor,
      data: itemStatusToBeUpdated
    }
    logger.debug('WalmartItemPreMapHook | itemProcessModeHandlingBeforeSubmit, Invoking NetSuite item status import adaptor, opts: ', JSON.stringify(opts))

      // Make call to NetSuite to update/create the item account id map records
    installerUtils.integratorApiIdentifierClient(opts, function (err, response, body) {
      logger.debug('itemProcessModeHandlingBeforeSubmit | integratorApiIdentifierClient, NetSuite response: ' + JSON.stringify(response))
      if (err) {
        logger.info('itemProcessModeHandlingBeforeSubmit, Walmart item account id map create/update callback error: ' + JSON.stringify(err))
        return callback(err)
      }
      if (response.statusCode !== 200) return callback(new Error('Failed to update item status in NetSuite, response: ' + JSON.stringify(response)))
        // TODO: Right now we are not checking the status code for each item. More graceful handling required.
      return callback(null)
    })
  })
}

WalmartItemExportHook.prototype.processItemCategoryMappings = function (options, callback) {
  var that = this
  try {
    var walmartItemCategoryHandler = new WalmartItemCategoryHandlerClass({options: options})
    walmartItemCategoryHandler.processCategoryMapping(function (err, preMapData) {
      if (err) {
        logger.info('walmartItemExportPreMapHook, err in processCategoryMapping callback. err : ' + JSON.stringify(err))
        return callback(null, that.attachErrorToAllItemRecords(err, options.data))
      }
      logger.debug('walmartItemExportPreMapHook | preMapData : ' + JSON.stringify(preMapData))
      return callback(null, preMapData)
    })
  } catch (ex) {
    logger.info('walmartItemExportPreMapHook, Exception message : ' + ex.message + '. StackTrace: ' + ex.stack)
    return callback(null, that.attachErrorToAllItemRecords(ex, options.data))
  }
}

WalmartItemExportHook.prototype.attachErrorToAllItemRecords = function (err, dataArray) {
  if (!dataArray || !_.isArray(dataArray) || dataArray.length < 1) { return [] }
  _.each(dataArray, function (data, index) {
    if (!data.errors) data.errors = []
    var SKU = (data && data['SKU']) || null
    var error = {
      code: err.code || err.name || 'UNABLE_TO_MAP',
      message: 'Failed to process Item with SKU : ' + SKU + ' due to following error : ' + err.message
    }
    data.errors.push(error)
  })
  return dataArray
}

module.exports = WalmartItemExportHook
