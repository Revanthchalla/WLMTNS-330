'use strict'

var _ = require('lodash')
, updateConnectorUtil = require('abstract-connector').updateConnectorUtil
, installerUtils = require('connector-utils').installerUtils
, util = require('util')
, AbstractVersionUpdate = require('connector-utils').AbstractVersionUpdate

function VersionUpdater(options) {
  this.updateLogic = updatelogic
  AbstractVersionUpdate.call(this, options)
}

util.inherits(VersionUpdater, AbstractVersionUpdate)

/**
* Properties of "This" object:
*         _bearerToken
*         _integrationId
*         _integration
*         _version
*/
var updatelogic = function(callback) {
  /*
    Migration to add two new fields for order import
    1) "label": "Add all orders against a default NetSuite customer"
    2) "label": "Assign NetSuite order status as Pending Approval"
  */
  installerUtils.logInSplunk('Inside updatelogic 1.1.3', 'info')

  try {
    addSettingsToSectionUpdateFunction.call(this, callback)
  } catch (e) {
    return callback(e)
  }
}

var addSettingsToSectionUpdateFunction = function (callback) {
  var that = this

  var settings = [
      {
          "sectionName": "Pricing",
          "configs": [
              {
                  "flowName": "NetSuite Pricing to Walmart Pricing Add/Update",
                  "settingsForThisSectionAndFlow": [
                      {
                          "opts": {
                              "resource": "_exportId"
                          },
                          "setting": {
                              "label": "NetSuite price level for syncing product price",
                              "tooltip": "Lets you choose the NetSuite price level to be used for exporting the price to Walmart.",
                              "required": false,
                              "value": null,
                              "type": "select",
                              "name": "exports_resourceId_updateSearchPricingFilters_listPriceLevels",
                              "supportsRefresh": true,
                              "options": []
                          }
                      }
                  ]
              }
          ]
      },
      {
          "sectionName": "Fulfillment",
          "configs": [
              {
                  "flowName": "NetSuite Fulfillment to Walmart Shipment Add",
                  "settingsForThisSectionAndFlow": [
                      {
                          "opts": {
                              "resource": "_importId"
                          },
                          "setting": {
                              "generates": [
                                  null
                              ],
                              "default": "",
                              "allowFailures": false,
                              "supportsGeneratesRefresh": true,
                              "supportsExtractsRefresh": true,
                              "generateFieldHeader": "Walmart Ship Method",
                              "extractFieldHeader": "NetSuite Ship Method",
                              "label": "Ship Method Mapping",
                              "map": {},
                              "tooltip": "Lets you map the shipping methods between Walmart and NetSuite. You can also provide a default value in case no match is found.",
                              "title": "Map Ship Methods",
                              "name": "imports_resourceId_shipmethodLookupForFulfillment_listShipMethodsWithoutIds_listWalmartShipMethods",
                              "type": "staticMapWidget"
                          }
                      }
                  ]
              }
          ]
      },
      {
          "sectionName": "Order",
          "configs": [
              {
                  "flowName": "Walmart Order to NetSuite Order Add",
                  "settingsForThisSectionAndFlow": [
                      {
                          "opts": {
                              "resource": "_importId",
                              "indexToAddAt" : 0
                          },
                          "setting": {
                              "generates": [
                                  null
                              ],
                              "default": "",
                              "allowFailures": false,
                              "supportsGeneratesRefresh": true,
                              "supportsExtractsRefresh": true,
                              "generateFieldHeader": "NetSuite Ship Method",
                              "extractFieldHeader": "Walmart Ship Method",
                              "label": "Ship Method Mapping",
                              "map": {},
                              "tooltip": "Lets you map the shipping methods between Walmart and NetSuite. You can also provide a default value in case no match is found.",
                              "title": "Map Ship Methods",
                              "name": "imports_resourceId_shipmethodLookup_listWalmartShipMethods_listShipMethods",
                              "type": "staticMapWidget"
                          }
                      },
                      {
                          "opts": {
                              "resource": "_exportId",
                              "indexToAddAt" : 1
                          },
                          "setting": {
                              "label": "Add orders created after",
                              "tooltip": "Lets you define the order creation date in Walmart only after which the orders should be imported into NetSuite.",
                              "type": "datetime",
                              "name": "exports_resourceId_orderStartDateFilter",
                              "value": ""
                          }
                      }
                  ]
              },
              {
                  "flowName": "Walmart Order to NetSuite Order On Demand Add",
                  "settingsForThisSectionAndFlow": [
                      {
                          "opts": {
                              "resource": "_exportId",
                              "indexToAddAt" : 1
                          },
                          "setting": {
                              "label": "Walmart Order Id(s)",
                              "tooltip": "Provide a single or multiple comma-separated Walmart order ids and click on 'Save' button to on-demand import of orders from Walmart into NetSuite. The max number of order ids that should be specified at a time is 10.",
                              "type": "text",
                              "name": "exports_resourceId_invokeOnDemandOrderImport",
                              "value": ""
                          }
                      },
                      {
                          "opts": {
                              "resource": "_exportId",
                              "indexToAddAt" : 2
                          },
                          "setting": {
                              "label": "Auto Acknowledge On Demand Orders",
                              "tooltip": "If checked, connector auto acknowledges orders that are imported using the 'Walmart Order Id(s)'. Recommended approach is to keep this box unchecked before you go live with the connector & keep it checked once live in Production.",
                              "type": "checkbox",
                              "name": "exports_resourceId_autoAcknowledgeOnDemandOrders",
                              "value": false
                          }
                      }
                  ]
              }
              //More settings
          ]
      }
  ]

  var options = {
    'this' : that,
    'settings' : settings
  }
  updateConnectorUtil.addSettings(options,callback)
}

exports.VersionUpdater = VersionUpdater
