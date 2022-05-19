'use strict'

var _ = require('lodash')
, assert = require('assert')
, moment = require('moment')
, logger = require('winston')
, hooksTestUtil = require('./hooksTestUtil').hooksTestUtil
, FulfillmentHooks = require('../../src/hooks/fulfillmentHooks')

describe('FulfillmentHooks unit tests', function () {

  it('should do the preMapProcessing correctly for provided positive data', function (done) {
    var FulfillmentHooksHandler = new FulfillmentHooks()
    , preMapDataArray = [
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Shipping Date": "9/30/2016",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "FedEx123",
            "Quantity": "1",
            "eTail Order Line Id": "1",
            "Tracking Number": "1234521",
            "Internal ID": "20169"
        },
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Shipping Date": "9/30/2016",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "USPS-More",
            "Quantity": "1",
            "eTail Order Line Id": "3",
            "Tracking Number": "1234521",
            "Internal ID": "20169"
        },
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Shipping Date": "9/30/2016",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "FedEx123",
            "Quantity": "1",
            "eTail Order Line Id": "1",
            "Tracking Number": "111",
            "Internal ID": "20169"
        }
    ]
    var response = FulfillmentHooksHandler.preMapProcessing(preMapDataArray)
    assert.equal(response.length, 2)
    assert.ok(moment(response[0]['Shipping Date']).isValid())
    assert.ok(moment(response[1]['Shipping Date']).isValid())
    return done()
  })

  it('should do the preMapProcessing correctly when shippingDate not present in the data', function (done) {
    var FulfillmentHooksHandler = new FulfillmentHooks()
    , preMapDataArray = [
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "FedEx123",
            "Quantity": "1",
            "eTail Order Line Id": "1",
            "Tracking Number": "1234521",
            "Internal ID": "20169"
        },
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "USPS-More",
            "Quantity": "1",
            "eTail Order Line Id": "3",
            "Tracking Number": "1234521",
            "Internal ID": "20169"
        },
        {
            "id": "20169",
            "recordType": "itemfulfillment",
            "eTail Order Id": "3576617406622",
            "Ship Method": "Pick-up at store",
            "Shipping Carrier": "FedEx123",
            "Quantity": "1",
            "eTail Order Line Id": "1",
            "Tracking Number": "111",
            "Internal ID": "20169"
        }
    ]
    var response = FulfillmentHooksHandler.preMapProcessing(preMapDataArray)
    assert.equal(response.length, 2)
    assert(moment(response[0]['Shipping Date']).isValid())
    assert.ok(moment(response[1]['Shipping Date']).isValid())
    return done()
  })
})
