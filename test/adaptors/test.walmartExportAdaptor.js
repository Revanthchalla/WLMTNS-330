'use strict'

var _ = require('lodash')
, assert = require('assert')
, logger = require('winston')
, adaptorTestUtil = require('./adaptorTestUtil').adaptorTestUtil
, ConnectorWrapper = require('abstract-connector').ConnectorWrapper
, WalmartExportAdaptor = require('../../src/adaptors/walmartExportAdaptor')
, nock = require('nock')

describe('Walmart Export Adaptor Tests', function () {

  describe('Prepare Request Tests', function () {

    afterEach(function (done) {
      nock.cleanAll()
      done()
    })

    it('should return error if wrapper options do not have a proper connection', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Cannot prepare HTTP request options for Walmart, Cannot find connection details in Integrator options')
        done()
      })
    })

    it('should return proper request options for delta flow', function (done) {
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(200, {access_token: "access_token",token_type: "Bearer",expires_in: 900})

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorDeltaFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        if(err) return done(err)
        assert.equal(requestOptions.uri, 'https://marketplace.walmartapis.com/v2/orders/released/?createdStartDate=2016-08-19T05:24:49.337Z&limit=20')
        assert.equal(requestOptions.method, 'GET')
        assert.equal(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        done()
      })
    })

    it('should throw error even after retrying maximum number of time for accesstoken error', function (done) {
      this.timeout(150000)
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(500)
      var options = adaptorTestUtil.loadJson('exportAdaptorDeltaFlowOptions')
      delete options.connection.unencrypted.walmartConsumerId
      options.connection.unencrypted.clientId = '111111'
      options.connection.encrypted.clientSecret = '11111'

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(options)
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        if(err) {
          assert.deepEqual(err.message, 'Unable to make call to Token API for export=57b5cd1710d880c83fdcad9b. Error=Error: Received invalid response from Walmart.')
          return done()
        }
      })
    })

    it('should throw error even after retrying maximum number of time for accesstoken error where accestoken is not present', function (done) {
      this.timeout(150000)
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(200, {})
      var options = adaptorTestUtil.loadJson('exportAdaptorDeltaFlowOptions')
      delete options.connection.unencrypted.walmartConsumerId
      options.connection.unencrypted.clientId = '111111'
      options.connection.encrypted.clientSecret = '11111'

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(options)
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        if(err) {
          assert.deepEqual(err.message, 'Unable to make call to Token API for export=57b5cd1710d880c83fdcad9b. Error=Error: Received invalid response from Walmart.')
          return done()
        }
      })
    })

    it('should process the request if accesstoken call is successfull', function (done) {
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(200, {access_token: "access_token",token_type: "Bearer",expires_in: 900})
      var options = adaptorTestUtil.loadJson('exportAdaptorDeltaFlowOptions')
      delete options.connection.unencrypted.walmartConsumerId
      options.connection.unencrypted.clientId = '111111'
      options.connection.encrypted.clientSecret = '11111'

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(options)
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        if(err) {
          return done(err)
        }
        assert.equal(requestOptions.uri, 'https://marketplace.walmartapis.com/v2/orders/released/?createdStartDate=2016-08-19T05:24:49.337Z&limit=20')
        assert.equal(requestOptions.method, 'GET')
        assert.equal(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        done()
      })
    })

    it('should return proper request options for preview flow', function (done) {
      nock('https://marketplace.walmartapis.com')
        .persist()
        .post('/v3/token')
        .reply(200, {access_token: "access_token",token_type: "Bearer",expires_in: 900})

      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        if(err) return done(err)
        //assert.equal(requestOptions.uri, 'https://marketplace.walmartapis.com/undefined/v2/orders?&createdStartDate=2016-07-19')
        assert.equal(requestOptions.method, 'GET')
        assert.equal(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        //assert.equal(requestOptions.headers['WM_CONSUMER.ID'], '7611ebce-74c1-4ac9-8d3f-ab915b6db785')
        done()
      })
    })

    it('should return the request options if wrapper.getCache().nextCursor is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = true
      ConnectorWrapperInstance.getConfig().onDemandOrderIds = true
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.method, 'GET')
        assert.deepEqual(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.ID'], '7611ebce-74c1-4ac9-8d3f-ab915b6db785')
        done()
      })
    })

    it('should set startDateTime if wrapper.config.datefield is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = false
      ConnectorWrapperInstance.getOptions().test = null
      ConnectorWrapperInstance.getConfig().dateField = true
      ConnectorWrapperInstance.getConfig()[ConnectorWrapperInstance.getConfig().dateField] = true

      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.notEqual(requestOptions.headers['WM_SEC.TIMESTAMP'], null)
        done()
      })
    })

    it('should return the request options if config.onDemandOrderIds is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = false
      ConnectorWrapperInstance.getOptions().test = null
      ConnectorWrapperInstance.getConfig().dateField = true
      ConnectorWrapperInstance.getConfig().onDemandOrderIds = ['1', '2', '3']
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.method, 'GET')
        assert.deepEqual(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.ID'], '7611ebce-74c1-4ac9-8d3f-ab915b6db785')
        done()
      })
    })

    it('should set consumerChannelType to V3_API_VERSION_IDENTIFIER if options.connection.unencrypted.consumerChannelType is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      ConnectorWrapperInstance.getOptions().connection.unencrypted.consumerChannelType = 'abc'
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.CHANNEL.TYPE'], 'abc')
        done()
      })
    })

    it('Should throw an error inside prepareRequest if consumerChannelType is null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      ConnectorWrapperInstance.getOptions().connection.unencrypted.consumerChannelType = null
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Connection Encrypted info should contain consumerChannelType for the API Version : v3')
        done()
      })
    })

    it('should return the request options if wrapper.getCache().nextCursor is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = true
      ConnectorWrapperInstance.getConfig().onDemandOrderIds = true
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.method, 'GET')
        assert.deepEqual(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.ID'], '7611ebce-74c1-4ac9-8d3f-ab915b6db785')
        done()
      })
    })

    it('should set startDateTime if wrapper.config.datefield is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = false
      ConnectorWrapperInstance.getOptions().test = null
      ConnectorWrapperInstance.getConfig().dateField = true
      ConnectorWrapperInstance.getConfig()[ConnectorWrapperInstance.getConfig().dateField] = true

      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.notEqual(requestOptions.headers['WM_SEC.TIMESTAMP'], null)
        done()
      })
    })

    it('should return the request options if config.onDemandOrderIds is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getCache().nextCursor = false
      ConnectorWrapperInstance.getOptions().test = null
      ConnectorWrapperInstance.getConfig().dateField = true
      ConnectorWrapperInstance.getConfig().onDemandOrderIds = ['1', '2', '3']
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.method, 'GET')
        assert.deepEqual(requestOptions.headers['WM_SVC.NAME'], 'Walmart Marketplace')
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.ID'], '7611ebce-74c1-4ac9-8d3f-ab915b6db785')
        done()
      })
    })

    it('should set consumerChannelType to V3_API_VERSION_IDENTIFIER if options.connection.unencrypted.consumerChannelType is not null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      ConnectorWrapperInstance.getOptions().connection.unencrypted.consumerChannelType = 'abc'
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(requestOptions.headers['WM_CONSUMER.CHANNEL.TYPE'], 'abc')
        done()
      })
    })

    it('Should throw an error inside prepareRequest if consumerChannelType is null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorTestFlowOptions'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getConfig().apiVersion = 'v3'
      ConnectorWrapperInstance.getOptions().connection.unencrypted.consumerChannelType = null
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.deepEqual(err.message, 'Connection Encrypted info should contain consumerChannelType for the API Version : v3')
        done()
      })
    })

    it('should return proper error, for options with invalid key', function (done) {
      this.timeout(150000)
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions(adaptorTestUtil.loadJson('exportAdaptorDeltaFlowOptionsInvalidKey'))
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.prepareRequest(ConnectorWrapperInstance, {}, function (err, requestOptions) {
        assert.notEqual(err.message, null)
        done()
      })
    })

  })

  describe('Handle Fatal Request Error Tests', function () {

    it('should return response if error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.handleFatalRequestError(ConnectorWrapperInstance, {}, function (err, res) {
        assert.deepEqual(res.data, [])
        assert.deepEqual(res.errors[0].code, 'UNABLE_TO_EXPORT_DATA')
        done()
      })
    })

    it('should return null if no error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.handleFatalRequestError(ConnectorWrapperInstance, null, function (err) {
        assert.equal(err, null)
        done()
      })
    })
  })

  describe('Paging Action Before Response Return Tests', function () {
    var response = {
      status: 'success'
    }

    it('should return response if no error', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.pagingActionBeforeResponseReturn(ConnectorWrapperInstance, response, function (err, res) {
        assert.deepEqual(res, { status: 'success' })
        done()
      })
    })

    it('should return response if getIsPreviewCall returns true', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      ConnectorWrapperInstance.getIsPreviewCall = function () {
        return true
      }
      WalmartExportAdaptorInstance.pagingActionBeforeResponseReturn(ConnectorWrapperInstance, response, function (err, res) {
        assert.deepEqual(res, { status: 'success' })
        done()
      })
    })

    it('should return response as null if walmartResponse is null', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({ configuration: {}, connection: {} })
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.pagingActionBeforeResponseReturn(ConnectorWrapperInstance, null, function (err, res) {
        assert.deepEqual(res, null)
        done()
      })
    })

    it('should set isLastPage to false and return the response if walmartResponse.list.meta.nextCursor contains hasMoreElements as true', function (done) {
      var ConnectorWrapperInstance = new ConnectorWrapper()
      ConnectorWrapperInstance.setOptions({
        configuration: {},
        connection: {}
      })
      var res = {
        list: {
          meta: {
            nextCursor: ['hasMoreElements=true']
          }
        }
      }
      var WalmartExportAdaptorInstance = new WalmartExportAdaptor()
      WalmartExportAdaptorInstance.pagingActionBeforeResponseReturn(ConnectorWrapperInstance, res, function (err, response) {
        assert.deepEqual(ConnectorWrapperInstance._isLastPage, false)
        assert.deepEqual(response, res)
        done()
      })
    })

  })
})
