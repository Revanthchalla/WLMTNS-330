'use strict'

var installerUtils = require('connector-utils').installerUtils
, util = require('util')
, AbstractVersionUpdate = require('connector-utils').AbstractVersionUpdate
, _ = require('lodash')

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
    Migration to add Tabbed Sections for Order Export
  */
  installerUtils.logInSplunk('Inside updatelogic 1.3.1', 'info')

  try {
    correctOrderSectionIfCorrupted.call(this, callback)
  } catch (e) {
    return callback(e)
  }
}

var correctOrderSectionIfCorrupted = function (callback) {
  var that = this
  , integration = that.getIntegration()
  , sections = integration.settings.sections

  var orderSection = _.find(sections, function (section) {
    if(section.title === 'Order') return true
  }) || null

  if(!orderSection) {
    installerUtils.logInSplunk('Cannot find order section in the integration : ' + JSON.stringify(integration))
    return callback(new Error('Cannot find order section in the integration'))
  }

  var customerTab = _.find(orderSection.sections, function (subSection) {
    if(subSection.title === 'Customers') return true
  }) || null

  if(!customerTab) {
    installerUtils.logInSplunk('Cannot find customerTab in the integration : ' + JSON.stringify(integration))
    return callback(new Error('Cannot find customerTab in the integration'))
  }

  if(customerTab.fields && _.isArray(customerTab.fields) && customerTab.fields.length > 0)
    return callback()

  var orderImportAdaptorId = integration.settings.commonresources.orderImportAdaptorId || null

  if(!customerTab.fields || !_.isArray(customerTab.fields)) customerTab.fields = []

  var settingJson = {
    "label": "Default NetSuite customer for all Walmart orders"
    , "tooltip": "Provide the internal id of the default customer record in NetSuite if you prefer to skip the creation of new customer records in NetSuite for each new order from Walmart and assign a default customer record to all the Walmart orders."
    , "type": "input"
    , "name": "imports_" + orderImportAdaptorId + "_setDefaultCustomerId"
    , "value": null
  }

  customerTab.fields.push(settingJson)
  installerUtils.logInSplunk('correctOrderSectionIfCorrupted, updated integration : ' + JSON.stringify(integration))
  that.setIntegration(integration)
  return callback(null, that)
}

exports.VersionUpdater = VersionUpdater
