'use strict'

  var _ = require('lodash')
  , logger = require('winston')
  , EtailUtil = require('abstract-connector').eTailUtil

function WalmartOrderImportHooks(config) {

}

WalmartOrderImportHooks.prototype.createCustomerArray = function(orderJson, customerData) {
  logger.debug('WalmartOrderImportHooks, inside createCustomerArray | orderJson:', JSON.stringify(orderJson))
  logger.debug('WalmartOrderImportHooks, inside createCustomerArray | customerData:', JSON.stringify(customerData))

  var customerObject = {}
    , shipAddressObject = {}
    , shippingAddressObject = {}
    , customerFullName = ''

  customerObject['shippingAddressArray'] = []
  customerObject.email = orderJson.customerEmailId

  if(orderJson.shippingInfo) {
    customerObject.order_id = orderJson.purchaseOrderId
    customerObject.phone = orderJson.shippingInfo.phone
    shippingAddressObject.phone = orderJson.shippingInfo.phone
    shippingAddressObject.estimatedDeliveryDate = orderJson.shippingInfo.estimatedDeliveryDate
    shippingAddressObject.estimatedShipDate = orderJson.shippingInfo.estimatedShipDate
    shippingAddressObject.methodCode = orderJson.shippingInfo.methodCode

    if(orderJson.shippingInfo.postalAddress) {
      shippingAddressObject.name = orderJson.shippingInfo.postalAddress.name
      shippingAddressObject.address1 = orderJson.shippingInfo.postalAddress.address1
      shippingAddressObject.address2 = orderJson.shippingInfo.postalAddress.address2
      shippingAddressObject.city = orderJson.shippingInfo.postalAddress.city
      shippingAddressObject.state = orderJson.shippingInfo.postalAddress.state
      shippingAddressObject.postalCode = orderJson.shippingInfo.postalAddress.postalCode
      shippingAddressObject.country = orderJson.shippingInfo.postalAddress.country
      shippingAddressObject.addressType = orderJson.shippingInfo.postalAddress.addressType
      customerFullName = orderJson.shippingInfo.postalAddress.name
    }
  }

  //to extract firstname and lastname
  if(!!customerFullName) {
    var customerNameObject = EtailUtil.handleCustomerName(customerFullName)
    if (customerNameObject) {
        customerObject.fullname = customerNameObject.fullname
        customerObject.firstname = customerNameObject.firstname
        customerObject.lastname = customerNameObject.lastname
    }
  }

  customerObject.shippingAddressArray.push(shippingAddressObject)
  customerData.push(customerObject)

  logger.debug('inside createCustomerArray | customerData after :', JSON.stringify(customerData))
  return customerData
}

WalmartOrderImportHooks.prototype.customerImportCallback = function(err, response, body, orderData, callback) {
  logger.debug('WalmartOrderImportHooks, inside customerImportCallback | response:', JSON.stringify(response))
  if (err)
    return callback(err)

  if (!(response && response.statusCode && (response.statusCode >= 200 && response.statusCode < 400))) {
    return callback({
        name: 'invalid_response_statuscode'
        , message: 'statusCode verification failed for customer, response' + JSON.stringify(body)
    })
  }

  if (!_.isArray(body) || body.length === 0) {
    //the body is not array this means that we got some error while invoking customer import adaptor, let's throw the error
    return callback({
      name: 'invalid_response'
      , message: JSON.stringify(body)
    })
  }

  //creating response for order import adaptor
  var custImportHookResp = []
  _.each(body, function(responseValue, responseIndex) {

    logger.debug('WalmartOrderImportPreMapHook| responseValue.statusCode' + responseValue.statusCode)
    if (responseValue.statusCode !== 200) {
      logger.info('WalmartOrderImportPreMapHook| WalmartOrderImportPreMapHook|errorsArray' + JSON.stringify(responseValue.errors))
      custImportHookResp.push({ 'errors' : responseValue.errors })
    } else {
       logger.debug('WalmartOrderImportPreMapHook| customer Add/Update is successful for Walmart order', + responseValue.id)
       orderData[responseIndex]['netSuiteCustomerId'] = responseValue.id
       custImportHookResp.push({ 'data' : orderData[responseIndex] })
    }
  })
  logger.debug('inside customerImportCallback |  custImportHookResp :', JSON.stringify(custImportHookResp))
  return callback (null, custImportHookResp)
}

module.exports = WalmartOrderImportHooks
