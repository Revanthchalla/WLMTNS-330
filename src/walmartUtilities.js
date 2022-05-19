'use strict'

var logger = require('winston')
    , eTailUtil = require('abstract-connector').eTailUtil
    , MappingUtility = require('./util/mappingUtility')
    , _ = require('lodash')

function WalmartUtilities (params) {

  logger.debug('WalmartUtilities', 'init')
  var UTILITY_LIST_TO_REGISTER = [{
      class : MappingUtility,
      params : params
    }]

  var getUtilityList = function(){
    var list = []
    _.each(UTILITY_LIST_TO_REGISTER, function(utilityObj, name){
      list.push(new utilityObj.class(utilityObj.params))
    })
    return list
  }

  eTailUtil.addFunctionsToPrototype(WalmartUtilities, getUtilityList())
}

module.exports = WalmartUtilities