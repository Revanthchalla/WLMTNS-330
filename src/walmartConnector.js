'use strict'
 var AbstractConnector = require('abstract-connector').AbstractConnector
  , AbstractEtailConnector = require('abstract-connector').AbstractEtailConnector
  , WalmartWrapper = require('./walmartWrapper')
  , WalmartSettings = require('./walmartSettings')
  , WalmartInstaller = require('./walmartInstaller')
  , WalmartHooks = require('./walmartHooks')
  , WALMART_CONSTANTS = require('./walmartConstants')
  , WalmartUtilities = require('./walmartUtilities')
  , WalmartUninstaller = require('./walmartUninstaller')
  , util = require('util')
  , handlebarsUtil = require('./util/handlebarsUtil')

function WalmartConnector() {
 AbstractEtailConnector.call(this)
 handlebarsUtil.addHelpers()
}

util.inherits(WalmartConnector, AbstractEtailConnector)

WalmartConnector.prototype.getConnectorConstants = function(){
  return WALMART_CONSTANTS
}

WalmartConnector.prototype.settings = new WalmartSettings()

WalmartConnector.prototype.installer = new WalmartInstaller()

WalmartConnector.prototype.wrappers = new WalmartWrapper()

WalmartConnector.prototype.hooks = WalmartHooks

WalmartConnector.prototype.utilities = new WalmartUtilities(WALMART_CONSTANTS)

WalmartConnector.prototype.uninstaller = new WalmartUninstaller()

module.exports = WalmartConnector
