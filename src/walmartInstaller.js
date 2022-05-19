'use strict'

var WALMART_CONSTANTS = require('./walmartConstants')
, util = require('util')
, utils = require('connector-utils').installerUtils
, AbstractEtailInstaller = require('abstract-connector').AbstractEtailInstaller
, logger = require('winston')
, installerUtils = require('connector-utils').installerUtils
, WALMART_CONSTANTS    = require('./walmartConstants')
, _ = require('lodash')

function WalmartInstaller() {
  AbstractEtailInstaller.call(this)
}

util.inherits(WalmartInstaller, AbstractEtailInstaller)

WalmartInstaller.prototype.getConnectorConstants = function() {
  return WALMART_CONSTANTS
}

WalmartInstaller.prototype.preEtailProductBundleCreateRecordsHook = function (hookRequest, callback) {
  var random5DigitId = Math.floor(Math.random() * 90000) + 10000
  hookRequest.records.state.info.response.accountid = random5DigitId
  createAccountName(hookRequest, function (err, responsehookRequest) {
    if (err) {
      logger.info('Inside preEtailProductBundleCreateRecordsHook: Error occur while creating account name: ' + JSON.stringify(err))
      return callback(new Error('Error occur while creating account name: ' + err.message ? err.message : err))
    }
    logger.debug('Inside preEtailProductBundleCreateRecordsHook: responsehookRequest: '+ JSON.stringify(responsehookRequest))
    return callback(null, responsehookRequest)
  })
}

var createAccountName = function (hookRequest, callback) {
  if (!hookRequest || !hookRequest.options || !hookRequest.options._integrationId) {
    logger.info('Inside createAccountName: _integrationId not found ')
    return callback(new Error('Integration is corrupted, integrationId is not available. Please contact Celigo Support.'))
  }

  var integrationId = hookRequest.options._integrationId
  var integrationRequest = {
    'bearerToken': hookRequest.options.bearerToken,
    'resourcetype': 'integrations',
    'id': integrationId
  }

  installerUtils.integratorRestClient(integrationRequest, function (err, res, integrationBody) {
    if (err) {
      logger.info('Inside createAccountName: Unable to get integrationRecord: ' + JSON.stringify(err))
      return callback(new Error('Unable to get integrationRecord: ' + JSON.stringify(err)))
    }

    if (integrationBody.install) {
      var walmartConnection = _.find(integrationBody.install, function (installRecord) {
        if (installRecord.name === 'Walmart Connection') {
          return true
        }
      })

      if (!walmartConnection || !walmartConnection._connectionId) {
        logger.info('Inside createAccountName: walmartConnectionId not found ')
        return callback(new Error('Integration is corrupted, walmartConnectionId is not available. Please contact Celigo Support.'))
      }

      var connectionRequest = {
        'bearerToken': hookRequest.options.bearerToken,
        'resourcetype': 'connections',
        'id': walmartConnection._connectionId
      }
      installerUtils.integratorRestClient(connectionRequest, function (err, res, connectionBody) {
        if (err) {
          logger.info('Inside createAccountName: Unable to get connectionRequest: ' + JSON.stringify(err))
          return callback(new Error('Unable to get connectionRequest: ' + JSON.stringify(err)))
        }

        if (!connectionBody || !connectionBody.wrapper || !connectionBody.wrapper.unencrypted) {
          logger.info('Inside createAccountName: Connection is corrupted.')
          return callback(new Error('Connection is corrupted. Please contact Celigo Support.'))
        }

        //var accountAbbr = WALMART_CONSTANTS.WALMART_MARKETPLACEID_MAP[connectionBody.http.unencrypted.consumerChannelType] || 'MISC'
        var accountAbbr = 'US'//TODO: Change this when supporting multi domain
        var accountCount = 1

        _.each(integrationBody.settings.storemap, function (storemap) {
          var integrationAccountCount = parseInt(storemap.accountname.split('-')[2])
          if (storemap.accountname.indexOf(accountAbbr) !== -1 && integrationAccountCount >= accountCount) {
            accountCount = integrationAccountCount + 1
          }
        })

        var accountName = 'WMT-' + accountAbbr + '-' + accountCount
        hookRequest.records.state.info.response.accountname = accountName
        hookRequest.records.state.info.response.externalIdPrefix = accountName
        hookRequest.records.state.info.response.marketPlaceDomain = accountAbbr

        return callback(null, hookRequest)
      })
    }
  })
}

module.exports = WalmartInstaller
