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
    Migration to add 1 new field for Fulfillment Export
    1) "label": "Auto Map Shipping Method to Valid Carrier"
  */
  installerUtils.logInSplunk('Inside updatelogic 1.2.0', 'info')

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
                            "label": "Automate shipment carrier mapping"
                            , "tooltip": "When enabled, the shipping methods in NetSuite are automatically mapped to shipping carriers in Walmart.  Else the mapping has to be done manually using field mappings page."
                            , "type": "checkbox"
                            , "name": "imports_resourceId_autoCarrierLookupEnabled"
                            , "value": true
                          }
                      }
                  ]
              }
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
