'use strict'

var util = require('util')
  , EtailSettings = require('abstract-connector').EtailSettings
  , logger = require('winston')
  , utils = require('connector-utils').installerUtils
  , UtilSettings = require('connector-utils').Settings
  , WALMART_CONSTANTS    = require('./walmartConstants')
  , async = require('async')
  , _ = require('lodash')

function WalmartSettings () {

  var self = this

  var orderStartDateFilter = function(paramObject, callback) {
    logger.debug('WalmartSettings, orderStartDateFilter, paramObject : ' + JSON.stringify(paramObject))
    var oldSettings = paramObject.oldSettings
    , newSettings = paramObject.newSettings
    , setting = paramObject.setting
    , settingParams = paramObject.settingParams
    , options = paramObject.options
    , settingsObj = new UtilSettings()

    var opts =
      { bearerToken : options.bearerToken
      , resourcetype : settingParams[0]  //'exports'
      , id : settingParams[1] //_exportId
      }
    utils.integratorRestClient(opts, function(err, response, body) {
      if (err) {
        logger.info('WalmartSettings, orderStartDateFilter, error in fetching export. ' + err.message)
        return callback(new Error('Unable to save start date setting. Please contact Celigo Support. Error : ' + err.message))
      }

      if(body && body.wrapper && body.wrapper.configuration) {
        body.wrapper.configuration.createdStartDate = newSettings[setting]
      }
      opts.data = body
      logger.debug('WalmartSettings, orderStartDateFilter, opts PUT call : ' + JSON.stringify(opts))
      utils.integratorRestClient(opts, function(err, response, body) {
        if (err) {
          logger.info('WalmartSettings, orderStartDateFilter, error in saving export. ' + err.message)
          return callback(new Error('Unable to save start date setting. Please contact Celigo Support. Error : ' + err.message))
        }
        return settingsObj.setFieldValues(paramObject, callback)
      })
    })
  }

  var listWalmartShipMethods = function(paramObject, callback) {
    var results = [
      { id : 'Standard', text : 'Standard'},
      { id : 'Express', text : 'Express'},
      { id : 'OneDay', text : 'OneDay'},
      { id : 'Freight', text : 'Freight'},
      { id : 'WhiteGlove', text : 'WhiteGlove'},
      { id : 'Value', text : 'Value'}
    ]
    return callback(null, results)
  }

  var listWalmartShipCarriers = function(paramObject, callback) {
    var results = [
      { id : 'UPS', text : 'UPS'},
      { id : 'USPS', text : 'USPS'},
      { id : 'FedEx', text : 'FedEx'},
      { id : 'UPS-MI', text : 'UPS-MI'},
      { id : 'FedEx SmartPost', text : 'FedEx SmartPost'},
      { id : 'OnTrac', text : 'OnTrac'}
    ]
    return callback(null, results)
  }

  // this function will get triggered when we turn off/on any flow.
  var handleSliderInput = function (paramObject, callback) {
    var options = paramObject.options
    var newSettings = paramObject.newSettings
    var settings = new UtilSettings()
    var storeMap

    loadStoreFlows(options, function (err, filteredFlows) {
      if (err) {
        return callback(err)
      }
      var productFlow = _.find(filteredFlows, function (flowObj) {
        return flowObj && flowObj.name && flowObj.name.match(/NetSuite Item to Walmart Product Add\/Update/g)
      })

      if (!productFlow || !productFlow.disabled) {
        return settings.actionSlider(paramObject, callback)
      }

      storeMap = settings.getStoreMap({
        settings: options.integrationRecord.settings,
        _flowId: newSettings.flowId
      })

      if (!storeMap || !storeMap.walmartHttpConnectionId) {
        return callback(new Error('Walmart HTTP connection id not found. Please contact Celigo support.'))
      }

      utils.integratorRestClient({
        bearerToken: options.bearerToken,
        resourcetype: 'connections',
        id: storeMap.walmartHttpConnectionId + '/ping'
      }, function (err, response, body) {
        if (err) {
          return callback(new Error('Unable to ping Walmart HTTP connection. Please contact Celigo support.'))
        }

        if (body && body.errors) {
          return callback(new Error('The Walmart HTTP Connection is offline. Please re-enter the connection credentials before enabling this flow. For more information, <a href="https://celigosuccess.zendesk.com/hc/en-us/articles/360003868652#docout-2" target="_blank">click here</a>'))
        }

        return settings.actionSlider(paramObject, callback)
      })
    })
  }

  var loadStoreFlows = function (options, callback) {
    /**
     * @param options : must have
     * bearerToken, shopId and integrationRecord
     * @param callback return (error, filteredFlows)
     **/
    utils.integratorRestClient({
      bearerToken: options.bearerToken,
      resourcetype: 'flows'
    }, function (err, response, flows) {
      if (err) {
        return callback(new Error('Unable to load flows'))
      }
      // filter based on shopId in the options
      var integrationRecord = options.integrationRecord
      if (!(integrationRecord && integrationRecord.settings && integrationRecord.settings.storemap)) {
        return callback(new Error('Setting schema is corrupted not able to find options.settings.storemap. Please contact Celigo support.'))
      }
      // find the appropriate store map now
      var store = _.find(integrationRecord.settings.storemap, function (store) {
        if (store.accountid === options.shopId) {
          return true
        }
      })
      if (!store) {
        return callback(new Error('Setting schema is corrupted not able to find storemap data. Please contact Celigo support.'))
      }

      // set the storemap in options
      options.storemap = store
      var filteredFlows = _.filter(flows, function (flow) {
        if (_.includes(store.flows, flow._id)) {
          return true
        }
      })
      return callback(null, filteredFlows)
    })
  }

  this.getWalmartCustomSettings = function() {
    var settings = new UtilSettings()
    var settingsToBeRegistered =  [
      {name : 'orderStartDateFilter', method : orderStartDateFilter},
      {name: 'autoAcknowledgeOnDemandOrders', method: settings.setFieldValues},
      {name: 'autoCarrierLookupEnabled', method: settings.setFieldValues},
      {name: 'shipmethodLookup', method: settings.staticMapFunctionFactory({
            distributed: {
              staticFielddMap : {
                "generate": "shipmethod"
                , "extract": "shippingInfo.methodCode"
                , "lookupName": "shipmethodLookup"
                , "internalId": true
              }
            }
          })
      },
      {name: 'shipmethodLookupForFulfillment', method: settings.staticMapFunctionFactory({
              importType : 'wrapper',
              staticFieldMap : {
                "extract": "[Ship Method]",
                "generate": "orderLineStatuses.orderLineStatus.trackingInfo.methodCode",
                "lookupName": "shipmethodLookup",
                "dataType": "string"
              }
            })
      },
      {name: 'setOrderTaxSettingPreference', method: settings.setFieldValues},
      {name: 'isTransactionLineLevelTaxEnabled', method: settings.setFieldValues},
      {name: 'setTransactionDefaultTaxableCode', method: settings.setFieldValues},
      {name: 'setSubstituteItemForTaxAmount', method: settings.setFieldValues},
      {name: 'shouldOverrideBothRateAndCode', method: settings.setFieldValues},
      {name: 'handleSliderInput', method: handleSliderInput}
    ]

    var refreshMetaDataFunctionsToBeRegistered = [
      {name: 'listWalmartShipMethods', method : listWalmartShipMethods},
      {name: 'listWalmartShipCarriers', method : listWalmartShipCarriers}
    ]

    return { settings : settingsToBeRegistered, refreshMetaData : refreshMetaDataFunctionsToBeRegistered }
  }

  var isSettingsGroupingEnabled = true
  EtailSettings.call(this, self.getWalmartCustomSettings(), isSettingsGroupingEnabled)
}

util.inherits(WalmartSettings, EtailSettings)

WalmartSettings.prototype.getConnectorConstants = function () {
  return WALMART_CONSTANTS
}


var createCategoryImportAdaptor = function (opts, callback) {
    try {
        utils.integratorRestClient(opts, function (err, res, body) {
            if (err) {
                logger.debug('createCategoryImportAdaptor, err : ' + JSON.stringify(err))
                return callback(err)
            }
            logger.debug('createCategoryImportAdaptor, res : ' + JSON.stringify(res))
            if (!res || !(res.statusCode === 200 || res.statusCode === 201)) return callback(new Error('POST call to importCategoryData returned following res : ' + JSON.stringify(res)))
            if (!body || !body._id) return callback(new Error('POST call to importCategoryData returned empty body'))
            return callback(null, body)
        })
    }
    catch (ex) {
        return callback(ex)
    }
}

var createCategoryVariationImportAdaptor = function (opts, callback) {
    try {
        utils.integratorRestClient(opts, function (err, res, body) {
            if (err) {
                logger.debug('createCategoryVariationImportAdaptor, err : ' + JSON.stringify(err))
                return callback(err)
            }
            logger.debug('createCategoryVariationImportAdaptor, res : ' + JSON.stringify(res))
            if (!res || !(res.statusCode === 200 || res.statusCode === 201)) return callback(new Error('POST call to importCategoryVariationData returned following res : ' + JSON.stringify(res)))
            if (!body || !body._id) return callback(new Error('POST call to importCategoryVariationData returned empty body'))
            return callback(null, body)
        })
    }
    catch (ex) {
        callback(ex)
    }
}


var updateIntegration = function (opts, callback) {
    try {
        var options = opts.options
        var imports = opts.imports
        options.data.settings.commonresources.nsCategoryVariationImportAdaptorId = imports.importCategoryVariationId
        options.data.settings.commonresources.nsCategoryImportAdaptorId = imports.importCategoryId
        options.data.settings.commonresources.nsCategoryVariationImportAdaptorApiIdentifier = imports.nsCategoryVariationImportAdaptorApiIdentifier
        options.data.settings.commonresources.nsCategoryImportAdaptorApiIdentifier = imports.nsCategoryImportAdaptorApiIdentifier
        utils.integratorRestClient(options, function (err, res, body) {
            if (err) {
                logger.debug('updateIntegration, err : ' + JSON.stringify(err))
                return callback(err)
            }
            logger.debug('updateIntegration, res : ' + JSON.stringify(res))
            if (!res || !(res.statusCode === 200 || res.statusCode === 201)) return callback(new Error('PUT call to updateIntegration returned following res : ' + JSON.stringify(res)))
            if (!body || !body._id) return callback(new Error('PUT call to updateIntegration returned empty body'))
            return callback()
        })
    }
    catch (ex) {
        callback(new Error(ex))
    }
}


var createCommonResourcesForItem = function (options,integration, callback) {
    var that = this
    var importCategoryVariationId
    var importCategoryId
    var nsCategoryImportAdaptorApiIdentifier
    var nsCategoryVariationImportAdaptorApiIdentifier
    try {
        var integrationId = integration._id
        var importCategoryVariationConfig = utils.loadJSON(WALMART_CONSTANTS.CONNECTOR_BASE_PATH + '/configs/imports/category-variation.json')
        if (!importCategoryVariationConfig || !importCategoryVariationConfig.data) return callback(new Error('CategoryVariationConfig not found'))
        var importCategoryConfig = utils.loadJSON(WALMART_CONSTANTS.CONNECTOR_BASE_PATH + '/configs/imports/category.json')
        if (!importCategoryConfig || !importCategoryConfig.data) return callback(new Error('importCategoryConfig not found'))
        var importCategoryData = importCategoryConfig.data
        var importCategoryVariationData = importCategoryVariationConfig.data
        var opts
        if (integration.settings.commonresources.nsCategoryVariationImportAdaptorId) return callback()
        importCategoryVariationData._connectionId = integration.settings.commonresources.netsuiteConnectionId
        opts = {
            bearerToken: options.options.bearerToken,
            resourcetype: 'imports',
            data: importCategoryVariationData
        }
        createCategoryVariationImportAdaptor(opts, function (err, response) {
            if (err) return callback(err)
            importCategoryVariationId = response._id
            nsCategoryVariationImportAdaptorApiIdentifier = response.apiIdentifier

            importCategoryData._connectionId = integration.settings.commonresources.netsuiteConnectionId
            opts = {
                bearerToken: options.options.bearerToken,
                resourcetype: 'imports',
                data: importCategoryData
            }
            createCategoryImportAdaptor(opts, function (err, response) {
                if (err) return callback(err)
                importCategoryId = response._id
                nsCategoryImportAdaptorApiIdentifier = response.apiIdentifier
                opts = {
                    'options': {
                        bearerToken: options.options.bearerToken,
                        resourcetype: 'integrations',
                        id: integrationId,
                        data: integration
                    },
                    "imports": {
                        "importCategoryVariationId": importCategoryVariationId,
                        "importCategoryId": importCategoryId,
                        "nsCategoryImportAdaptorApiIdentifier": nsCategoryImportAdaptorApiIdentifier,
                        "nsCategoryVariationImportAdaptorApiIdentifier":nsCategoryVariationImportAdaptorApiIdentifier
                    }
                }
                updateIntegration(opts, function (err) {
                    if (err) return callback(err)
                    return callback()
                })
            })
        })
    }
    catch (ex) {
        callback(ex)
    }
}

WalmartSettings.prototype.preEditionUpgradeHookForMultiStore = function(options, callback) {
  try{
    var that = this
    var integration = that._integrationBody
    if(!integration || !integration.settings || !integration.settings.commonresources ) return callback(new Error('integration got corrupted. Please contact to celigo support.'))
    options.records.state.info.response.accountid = options.storeObj.accountid
    options.records.state.info.response.accountname = options.storeObj.accountname
    options.records.state.info.response.externalIdPrefix = options.storeObj.externalIdPrefix
    options.records.state.info.response.stepcompleted = true
    options.records.state.info.response.marketPlaceDomain = options.storeObj.externalIdPrefix.split('-')[1]
    if (options.options.connectorEdition === 'standard') {
        createCommonResourcesForItem(options,integration, function (err) {
            if (err) return callback(err)
            return callback()
        })
    }
    else{
        return callback()
    }
  } catch(ex) {
    return callback(ex)
  }
}

module.exports = WalmartSettings