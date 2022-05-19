'use strict'

var _ = require('lodash')
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
  installerUtils.logInSplunk('Inside updatelogic 1.12.4', 'info')
  try {
    addGeneralSectionWithAccountNameSetting.call(this, callback)
  } catch (e) {
    return callback(e)
  }
}

var addGeneralSectionWithAccountNameSetting = function (callback) {
  var that = this
  , integration = that.getIntegration()

  installerUtils.logInSplunk('addGeneralSectionWithAccountNameSetting, started')

  integration.settings.general = [{
    id: "null"
  }]
  _.each(integration.settings.storemap, function(store) {
    if(store.shopInstallComplete === "true") {
      integration.settings.general.push(
        {
          "title": "General",
          "fields": [
             { "label": "Walmart Account Name",
              "tooltip": "This field represents the name of the Walmart account connected via this integration. The connector assigns a default value at first (example WMT-US-1) and it's recommended you update it to reflect the appropriate account name (max 20 chars). Modifying the account name also updates the corresponding labels on the NetSuite saved searches.",
              "value": store.accountname,
              "type": "input",
              "name": "general_" + store.accountid +"_setAccountName"
            },
          ],
          "id": store.accountid
        }
      )
    }
  })

  that.setIntegration(integration)
  installerUtils.logInSplunk('addGeneralSectionWithAccountNameSetting, ended')
  return callback(null, that)
}

exports.VersionUpdater = VersionUpdater
