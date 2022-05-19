'use strict'

var _ = require('lodash')
var util = require('util')
var AbstractEtailUninstaller = require('abstract-connector').AbstractEtailUninstaller
var WalmartNetSuiteUninstallHandler = require('./uninstaller/walmartNetSuiteUninstallHandler')
var logger = require('winston')

function WalmartUninstaller() {
  AbstractEtailUninstaller.call(this)
}

util.inherits(WalmartUninstaller, AbstractEtailUninstaller)

WalmartUninstaller.prototype.getUninstallerConfig = function () {
  return require('../configs/meta/uninstallConnector')
}

WalmartUninstaller.prototype.getConnectionIdLabel = function () {
  return 'walmartConnectionId'
}

WalmartUninstaller.prototype.getConnectorRegisteredHandlers = function () {
  return [

    { name : 'netsuite', classRef : WalmartNetSuiteUninstallHandler }
  ]
}

WalmartUninstaller.prototype.getGeneralSectionIdLabel = function () {
  return 'id'
}

WalmartUninstaller.prototype.getUninstallationSteps = function (callback) {
  var steps = require('../configs/wizards/uninstallStoreWizard')
  return callback(null, steps)
}

module.exports = WalmartUninstaller
