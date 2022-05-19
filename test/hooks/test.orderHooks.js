'use strict'

var _ = require('lodash')
, assert = require('assert')
, moment = require('moment')
, logger = require('winston')
, hooksTestUtil = require('./hooksTestUtil').hooksTestUtil
, OrderHooks = require('../../src/hooks/orderHooks')

describe('orderHooks unit tests', function () {

  it('(createCustomerArray) should return array of customer data when provided with orderJson', function (done) {
    var OrderHooksHandler = new OrderHooks()
    , orderJson = hooksTestUtil.loadJson('orderSampleData')
    , expectedResponse = [
        {
            "shippingAddressArray": [
                {
                    "phone": "2342423234",
                    "estimatedDeliveryDate": "2016-06-22T06:00:00.000Z",
                    "estimatedShipDate": "2016-06-15T06:00:00.000Z",
                    "methodCode": "Standard",
                    "name": "PGOMS Walmart",
                    "address1": "850 Cherry Avenue",
                    "address2": "Floor 5",
                    "city": "San Bruno",
                    "state": "CA",
                    "postalCode": "94066",
                    "country": "USA",
                    "addressType": "RESIDENTIAL"
                }
            ],
            "email": "rubdehiy@walmartlabs.com",
            "order_id": "2575263094491",
            "phone": "2342423234",
            "fullname": "PGOMS Walmart",
            "firstname": "PGOMS",
            "lastname": "Walmart"
        }
    ]
    var customerResponse = OrderHooksHandler.createCustomerArray(orderJson, [])
    assert.deepEqual(customerResponse, expectedResponse)
    return done()
  })

  describe('customerImportCallback unit tests', function () {

    it('should return callback error when provided with error', function (done) {
      var OrderHooksHandler = new OrderHooks()
      , error = {code : 'FSOCIETY', message : 'Evil corp needs to be taken down'}

      OrderHooksHandler.customerImportCallback(error, {}, {}, {}, function (err, custImportHookResp) {
        assert.deepEqual(err, error)
        return done()
      })
    })

    it('should return proper error when response.statusCode is invalid', function (done) {
      var OrderHooksHandler = new OrderHooks()
      , error = {name: "invalid_response_statuscode", message : "statusCode verification failed for customer, response{\"elliotIsCrazy\":true}"}

      OrderHooksHandler.customerImportCallback(null, {statusCode: 422}, {elliotIsCrazy : true}, {}, function (err, custImportHookResp) {
        assert.deepEqual(err, error)
        return done()
      })
    })

    it('should return proper error when body is invalid', function (done) {
      var OrderHooksHandler = new OrderHooks()
      , error = {name: "invalid_response", message : "{\"elliotIsCrazy\":true}"}

      OrderHooksHandler.customerImportCallback(null, {statusCode: 200}, {elliotIsCrazy : true}, {}, function (err, custImportHookResp) {
        assert.deepEqual(err, error)
        return done()
      })
    })

    it('should return proper error when response.statusCode is valid but not 200', function (done) {
      var OrderHooksHandler = new OrderHooks()
      , response = {"statusCode":200,"body":[{"statusCode":422,"errors":[{"source":"netsuite","code":"user_error","message":"Failed to Add/Update customer for Walmart Order# 2575263094491. Please enter value(s) for: Subsidiary"}]}],"headers":{"x-powered-by":"Express","content-type":"application/json; charset=utf-8","content-length":"187","etag":"W/\"bb-Dv1Lv0FgXsKeFRZxGxMGLQ\"","date":"Wed, 26 Oct 2016 12:16:21 GMT","connection":"close"},"request":{"uri":{"protocol":"http:","slashes":true,"auth":null,"host":"api.localhost.io:5000","port":"5000","hostname":"api.localhost.io","hash":null,"search":null,"query":null,"pathname":"/i10cc382eb","path":"/i10cc382eb","href":"http://api.localhost.io:5000/i10cc382eb"},"method":"POST","headers":{"Authorization":"Bearer ottc73b630ba2e2452c8780d04647b39dbc","Content-Type":"application/json","accept":"application/json","content-length":468}}}
      , body = response.body
      , orderData = [hooksTestUtil.loadJson('orderSampleData')]
      , expectedResponse = [
          {
              "errors": [
                  {
                      "source": "netsuite",
                      "code": "user_error",
                      "message": "Failed to Add/Update customer for Walmart Order# 2575263094491. Please enter value(s) for: Subsidiary"
                  }
              ]
          }
      ]

      OrderHooksHandler.customerImportCallback(null, response, body, orderData, function (err, custImportHookResp) {
        if(err) return done(err)
        assert.deepEqual(expectedResponse, custImportHookResp)
        return done()
      })
    })

    it('should return proper error when response.statusCode is 200', function (done) {
      var OrderHooksHandler = new OrderHooks()
      , response = {"statusCode":200,"body":[{"statusCode":200,"id":4650}],"headers":{"x-powered-by":"Express","content-type":"application/json; charset=utf-8","content-length":"30","etag":"W/\"1e-kRk07FpgdGI/GtZXtCrRUg\"","date":"Wed, 26 Oct 2016 12:18:02 GMT","connection":"close"},"request":{"uri":{"protocol":"http:","slashes":true,"auth":null,"host":"api.localhost.io:5000","port":"5000","hostname":"api.localhost.io","hash":null,"search":null,"query":null,"pathname":"/i10cc382eb","path":"/i10cc382eb","href":"http://api.localhost.io:5000/i10cc382eb"},"method":"POST","headers":{"Authorization":"Bearer ottbd07b0d430114ee794cc70dc86024b4d","Content-Type":"application/json","accept":"application/json","content-length":468}}}
      , body = response.body
      , orderData = [hooksTestUtil.loadJson('orderSampleData')]
      , expectedResponse = [
          { data : orderData[0] }
      ]

      OrderHooksHandler.customerImportCallback(null, response, body, orderData, function (err, custImportHookResp) {
        if(err) return done(err)
        assert.deepEqual(expectedResponse, custImportHookResp)
        return done()
      })
    })

  })

})
