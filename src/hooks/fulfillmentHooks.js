'use strict'
var _ = require('lodash')
, eTailUtil = require('abstract-connector').eTailUtil
, logger = require('winston')
, moment = require('moment')

function WalmartFulfillmentExportHooks(config)  {

  this.SHIPPING_METHOD_ID = 'Ship Method'
  this.SHIPPING_CARRIER_ID = 'Shipping Carrier'
  this.SHIPPING_DATE_ID = 'Shipping Date'
  this.TRACKING_NUMBER_ID = 'Tracking Number'
  this.ETAIL_ORDER_LINE_ID = 'eTail Order Line Id'
}

WalmartFulfillmentExportHooks.prototype.preMapProcessing =  function(preMapDataArray) {
  logger.debug('preMapProcessing, preMapDataArray : ', JSON.stringify(preMapDataArray))
  var self = this
    , uniqueArray = eTailUtil.getUniqueResultSet(preMapDataArray, self.ETAIL_ORDER_LINE_ID)

  _.each(uniqueArray, function(preMapDataObject, index) {
    self.handleDateFields(preMapDataObject)
  })

  logger.debug('preMapProcessing, uniqueArray : ', JSON.stringify(uniqueArray))
  return uniqueArray
}

WalmartFulfillmentExportHooks.prototype.handleDateFields =  function(preMapDataObject) {
  var self = this
    , shippingDateId = self.SHIPPING_DATE_ID
    , shippingDate = preMapDataObject[shippingDateId]
    , currentDate = new Date()
    , hours = null
    , minutes = null
    , seconds = null

  if(!shippingDate) {
    logger.debug('WalmartFulfillmentExportHooks, handleDateFields, shippingDate is null. Assigning current date.')
    shippingDate = moment().format('MM/DD/YY')
  }

  var formattedDate = eTailUtil.formatDate(shippingDate, 'MM/DD/YY', 'YYYY-MM-DD')
  //TODO adding current time of stack server for now, need to handle it in better way
  hours = currentDate.getHours() >= 10 ? currentDate.getHours() : '0'+ currentDate.getHours()
  minutes = currentDate.getMinutes() >= 10 ? currentDate.getMinutes() : '0'+ currentDate.getMinutes()
  seconds = currentDate.getSeconds() >= 10 ? currentDate.getSeconds() : '0'+ currentDate.getSeconds()
  formattedDate = formattedDate + 'T' + hours + ':' +  minutes + ':' +  seconds + 'Z'

  preMapDataObject[shippingDateId] = formattedDate
}

module.exports = WalmartFulfillmentExportHooks
