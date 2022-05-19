'use strict'

var _ = require('lodash')
  , assert = require('assert')
  , logger = require('winston')
  , nock = require('nock')
  , adaptorTestUtil = require('./adaptorTestUtil').adaptorTestUtil
  , ConnectorWrapper = require('abstract-connector').ConnectorWrapper
  , WalmartImportAdaptor = require('../../src/adaptors/walmartImportAdaptor')

describe('Walmart Import Adaptor Tests', function () {
  afterEach(function (done) {
    nock.cleanAll()
    done()
  })

  describe('Prepare Request Tests', function () {

    it('should return error if wrapper options do not have a proper connection', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Cannot prepare HTTP request options for Walmart, Cannot find connection details in Integrator options')
        done()
      })
    })

    it('should return proper request options for flow with handlebars', function (done) {
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(200, {access_token: "access_token",token_type: "Bearer",expires_in: 900})


      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      ConnectorWrapperInstance.setCurrentPreMapData({ purchaseOrderId: 123 })
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, { walmartOrderId: 123 }, function (err, requestOptions) {
        if(err) return done(err)
        assert.equal(requestOptions.uri, 'https://marketplace.walmartapis.com/v2/orders/123/acknowledge')
        assert.equal(requestOptions.method, 'POST')
        assert.equal(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        //assert.equal(requestOptions.headers['WM_CONSUMER.ID'], '345c59b3-705e-4073-b5a5-7ee6aec45402')
        assert.equal(requestOptions.headers['Content-Type'], 'application/xml')
        done()
      })
    })

    it('should throw an exception for options with invalid key', function (done) {
      this.timeout(150000)
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(500, 'Internal Server Error')

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getOptions().connection = {
        encrypted: 'abc',
        unencrypted: {
          consumerChannelType: 'cac'
        }
      }
      WalmartImportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Unable to make call to Token API for import=57b6ddd97805530805e5fbf9. Error=Error: Received invalid response from Walmart.')
        done()
      })
    })

    it('Should throw an error inside prepareRequest if consumerChannelType is null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      WalmartImportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Connection Encrypted info should contain consumerChannelType for the API Version : v3')
        done()
      })
    })

    it('should set consumerChannelType to V3_API_VERSION_IDENTIFIER inside prepareRequest if options.connection.unencrypted.consumerChannelType is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      var data = {
        consumerChannelType: 'v3'
      }
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getOptions().connection.unencrypted.consumerChannelType = 'abc'
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      WalmartImportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, data, function (err, requestOptions) {
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.CHANNEL.TYPE'], 'abc')
        done()
      })
    })

  })

  describe('Make Request Tests', function () {

    before(function (done) {
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v2/orders/123/acknowledge')
        .reply(200, adaptorTestUtil.loadJson('orderAcknowledgementResponse'))
      done()
    })

    after(function (done) {
      nock.cleanAll()
      done()
    })

    it('should return proper request options for flow with handlebars', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      var requestOptions =
      {
        "uri": "https://marketplace.walmartapis.com/v2/orders/123/acknowledge",
        "method": "POST",
        "headers": {
          "Accept": "application/xml",
          "Content-Type": "application/xml",
          "WM_SVC.NAME": "Walmart Marketplace",
          "WM_QOS.CORRELATION_ID": "1471859964564",
          "WM_SEC.TIMESTAMP": "1471859964564",
          "WM_SEC.AUTH_SIGNATURE": "FyUk8jQ20SP5+R6ZOcnML/+WKkyKYyOwPy3J/mMaT+12sCJx2E70CKXygp6+FTjFH6vwBjZ/ujVy/EzUd0wWlWWDoE5HnOcZ8KKMPCN0hVJ88X6P8ZoSbr//ynKm1bTgn9J95u1pJGBE5dFVGpiMxwKZe73oG3H7v9+UN30+18w=",
          "WM_CONSUMER.ID": "345c59b3-705e-4073-b5a5-7ee6aec45402"
        }
      }
      WalmartImportAdaptorInstance.makeRequest(ConnectorWrapperInstance, requestOptions, function (err, res, body) {
        if(err) return done(err)
        assert.equal(res.statusCode, 200)
        assert.deepEqual(res.body, adaptorTestUtil.loadJson('orderAcknowledgementResponse'))
        done()
      })
    })

    it('should throw an error if there are no proper request options', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('importAdaptorHandlebarFlowOptions'))
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.makeRequest(ConnectorWrapperInstance, null, function (err, res, body) {
        assert.deepEqual(err.message, 'Not able to make request, Empty requestOptions')
        done()
      })
    })

  })

  describe('before Response Transformation Tests', function () {

    it('should return if there is no body', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.beforeResponseTransformation(ConnectorWrapperInstance, null, function (err, body) {
        assert.equal(body, null)
        done()
      })
    })

    it('should return processedBody as response if there is body', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.beforeResponseTransformation(ConnectorWrapperInstance, ['abc', 'xyz'], function (err, res) {
        assert.deepEqual(res, ['abc', 'xyz'])
        done()
      })
    })
  })

  describe('handle Fatal Request Error Tests', function () {

    it('should return null if there is no error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.handleFatalRequestError(ConnectorWrapperInstance, null, function (err, res) {
        assert.equal(res, null)
        done()
      })
    })

    it('should return error as response if there is an error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      WalmartImportAdaptorInstance.handleFatalRequestError(ConnectorWrapperInstance, {}, function (err, res) {
        logger.info('res', JSON.stringify(res))
        assert.deepEqual(res.statusCode, 422)
        assert.deepEqual(res.errors[0].code, 'UNABLE_TO_IMPORT_DATA')
        done()
      })
    })

  })

  describe('after Response Transformation Tests', function () {

    it('should return response if there is no error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getWrapperResponseStatusCode = function () { return 200 }
      WalmartImportAdaptorInstance.afterResponseTransformation(ConnectorWrapperInstance, null, function (err, requestOptions) {
        assert.deepEqual(requestOptions.statusCode, 200)
        assert.deepEqual(requestOptions.errors, [])
        done()
      })
    })

    it('should push error and return the response if transformedResponse.errors.error is not an array', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getWrapperResponseStatusCode = function () { return 400 }
      ConnectorWrapperInstance.getHandler = function () {
        return { getErrorCodeString: function () { return 404 } }
      }
      var res = {
        errors: {
          error: 'sample'
        }
      }
      WalmartImportAdaptorInstance.afterResponseTransformation(ConnectorWrapperInstance, res, function (err, res) {
        assert.deepEqual(res.errors[0].message, 'INFO NOT AVAILABLE, DESCRIPTION NOT AVAILABLE')
        done()
      })
    })

    it('should push error and return the response if transformedResponse.errors.error is an array', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      var WalmartImportAdaptorInstance = new WalmartImportAdaptor()
      ConnectorWrapperInstance.getWrapperResponseStatusCode = function () { return 400 }
      ConnectorWrapperInstance.getHandler = function () {
        return { getErrorCodeString: function () { return 404 } }
      }
      var res = {
        errors: {
          error: ['sample']
        }
      }
      WalmartImportAdaptorInstance.afterResponseTransformation(ConnectorWrapperInstance, res, function (err, res) {
        assert.deepEqual(res.errors[0].message, 'INFO NOT AVAILABLE')
        done()
      })
    })
  })
})
