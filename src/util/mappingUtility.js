'use strict'

var util = require('util'),
  logger = require('winston'),
  MarketplaceMappingUtility = require('abstract-connector').MarketplaceMappingUtility,
  WalmartItemCategoryHandler = require('../handlers/walmartItemCategoryHandler')

function MappingUtility (params) {
  MarketplaceMappingUtility.call(this, params)

  this.getCategoryHandler = function (options) {
    logger.debug('MappingUtility | getCategoryHandler', WalmartItemCategoryHandler.name)
    return new WalmartItemCategoryHandler({options: options})
  }
}

util.inherits(MappingUtility, MarketplaceMappingUtility)
module.exports = MappingUtility
