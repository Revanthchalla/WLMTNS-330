'use strict'

var handlebars = require('handlebars')
var _ = require('lodash')
var logger = require('winston')

var helpers = {
    encodeURI: function(uri) { return encodeURI(uri) },
    encodeURIComponent: function(value) { return encodeURIComponent(value) }
}

exports.processString = function (source, data, callback) {
  logger.debug('handlebarsUtil, processString, source : ' + source)
  logger.debug('handlebarsUtil, processString, data : ' + JSON.stringify(data))
  if(!source || !data) return callback(null, source)
  //TODO : Handle case where data is empty array
  if(_.isArray(data) && data.length > 0) {
    data = data[0]
  }
  var result = source
  try {
    var template = handlebars.compile(source)
    result = template(data)
  } catch (ex) {
    return callback(new Error('Unable to process handlebar url: ' + source + ' for data : ' + JSON.stringify(ex)))
  }
  return callback(null, result)
}

exports.addHelpers = function () {
    for (var helperName in helpers) {
        handlebars.registerHelper(helperName, helpers[helperName])
    }
}