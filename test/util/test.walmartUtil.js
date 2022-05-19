'use strict'

var _ = require('lodash')
, assert = require('assert')
, logger = require('winston')
, walmartUtil = require('../../src/util/walmartUtil')


describe('Walmart Util tests', function () {

  describe('addHeaders unit tests',  function () {

    it('should add the default headers (when not provided in the config) and add other header values correctly', function (done) {
      var requestOptions = {}
      , expectedResult =
        { headers :
            { 'Accept' : 'application/xml'
            , 'Content-Type' : 'application/xml'
            , 'WM_SVC.NAME' : 'Walmart Marketplace'
            , "WM_QOS.CORRELATION_ID": "a"
            , "Authorization": "Basic encodedKey"
            , "WM_SEC.ACCESS_TOKEN": "accessToken"
            }
        }
      var result = walmartUtil.addHeaders(requestOptions, 'a', {accessToken: 'accessToken', encodedKey: 'encodedKey'})
      assert.deepEqual(result, expectedResult)
      done()
    })

    it('should retain the default headers, when provided in the config', function (done) {
      var requestOptions =
        { headers :
            { 'Accept' : 'application/json'
            , 'Content-Type' : 'application/json'
            , 'WM_SVC.NAME' : 'MARTHAAAAAAAAAA'
            }
        }
      var expectedResult =
        { headers :
            { 'Accept' : 'application/json'
            , 'Content-Type' : 'application/json'
            , 'WM_SVC.NAME' : 'MARTHAAAAAAAAAA'
            , "WM_QOS.CORRELATION_ID": "a"
            , "Authorization": "Basic encodedKey"
            , "WM_SEC.ACCESS_TOKEN": "accessToken"
            }
        }
      var result = walmartUtil.addHeaders(requestOptions, 'a', {accessToken: 'accessToken', encodedKey: 'encodedKey'})
      assert.deepEqual(result, expectedResult)
      done()
    })

    it('should not add the consumerChannelType header when not provided', function (done) {
      var requestOptions =
        { headers :
            { 'Accept' : 'application/json'
            , 'Content-Type' : 'application/json'
            , 'WM_SVC.NAME' : 'MARTHAAAAAAAAAA'
            }
        }
      var expectedResult =
        { headers :
            { 'Accept' : 'application/json'
            , 'Content-Type' : 'application/json'
            , 'WM_SVC.NAME' : 'MARTHAAAAAAAAAA'
            , "WM_CONSUMER.ID": "c"
            , "WM_QOS.CORRELATION_ID": "a"
            , "WM_SEC.AUTH_SIGNATURE": "b"
            , "WM_SEC.TIMESTAMP": "a"
            }
        }
      var result = walmartUtil.addHeaders(requestOptions, 'a', {signature: 'b', consumerId: 'c'})
      assert.deepEqual(result, expectedResult)
      done()
    })

  })

  describe('signRequest unit tests',  function () {

    it('should generate proper signature for correct key and input', function (done) {
      var key = 'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBALgEY/D+hV1qeTjfTVyyT0IGvCSmOOEIpsaTnWFXivKvmlHn3KEnikaC1WXAofS+Sb4mjp70OYwgCjjDldZRBo57fiNZ/6o3q87lSfouplryBXSZsyn0xPUA6tC6cq/nogwD2WX5qP2qM8K1m5xEbi9uWd0Uf3CKhyfwLs/rAuBzAgMBAAECgYEAkNsz6VQSnBTi1DhEaAIdjjZLCPaos8zhrFQrgaMuSBif/HXvIhVELnlzjyPy2fyphDxJ7SsH2hymr0SXwRwLceqgInpE/ktAQRcqkY0SpKajtlknHz+08dqp+hVZY/4UmzTf80mTh+IkbEnwtpTAQi5L1NV5YY4sti/PZzhrQPECQQDwMIcFPDgynSpQRXE/n/g1t3Ozzb2qE9K1dB0Z7+SonBIrq1ZTZ/Nr9Dk4ZLgjYYZjIZI+052lC4v3MeFAQoCtAkEAxCFK8GaM2B3lH5V8t/GLuhb6S0REv7Me+2JurPLksepKWAfAi1rYnOLC+C7HwgTlEuQyflhk6A1MN665DmZpnwJAf4lU+HusX3vCjxMAekdH9cXugufZMOkLtlvsY+xUnw8YOuXkla8ZuxXYGFCq0eakBBk8XW3iRFPoQx7SO1vUlQJBAIPeXqSETu6AKy2xNMn4fhoAmQlCPXcm2A3tgLyIE3wMKzBFBhCsZDgXvz9fNLAe2mZ5R/nrNO1RA43szEACW8ECQEsVL7goId95jRpoQ4AJ6nCKI9RGYbVBioUhBJIM3F2rOPNdOTRBFX4Y9YihmyPbzp7ReHqBYMICRNzchl+YFzc='
      , input = ['7611ebce-74c1-4ac9-8d3f-ab915b6db785', 'https://marketplace.walmartapis.com/v2/orders/released?limit=10', 'GET', '1470227500748'].join('\n')

      var signature = walmartUtil.signRequest(key, input)
      assert.deepEqual(signature.length, 172)
      done()
    })

    it('should error out for incorrect key', function (done) {
      var key = 'abcde'
      , input = ['7611ebce-74c1-4ac9-8d3f-ab915b6db785', 'https://marketplace.walmartapis.com/v2/orders/released?limit=10', 'GET', '1470227500748'].join('\n')

      try {
        var signature = walmartUtil.signRequest(key, input)
      } catch (ex) {
        assert.notEqual(ex.message, null)
      }
      done()
    })

  })

})
