'use strict'
var fs = require('fs')
  , _ = require('lodash')
  , logger = require('winston')

function testUtil(map) {
  logger.info('Initializing test util')
  this.fileNameToPathMap = map
  this.optionsData =
    { 'bearerToken': 'testBearerToken'
    , '_integrationId': 'testIntegrationId'
    }
}

testUtil.prototype.loadJson = function(fileName) {
  if (this.data.hasOwnProperty(fileName))
    return _.cloneDeep(this.data[fileName])
  else
    throw new Error(fileName + ' does not exist')
}

testUtil.prototype.loadFiles = function() {
  var localData = {}
  _.forEach(this.fileNameToPathMap, function(value, key) {
    localData[key] = JSON.parse(fs.readFileSync(value))
  })
  this.data = localData
}

exports.testUtil = testUtil
