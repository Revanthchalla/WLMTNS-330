'use strict'

var _ = require('lodash')
var assert = require('assert')
// var logger = require('winston')
var nock = require('nock')
var ItemHooks = require('../../src/hooks/itemHooks')
var WALMART_CONSTANTS = require('../../src/walmartConstants')

/* global describe it beforeEach afterEach */
describe('ItemHooks unit tests', function () {

  describe('for processProductId tests', function () {

    it('should do the preMapProcessing correctly for gtin, upc, isbn, ean', function (done) {
      var ItemHooksHandler = new ItemHooks()
      var preMapData = {
        'id': '20169',
        'GTIN': 'GTIN-123456789101',
        'EAN': 'EAN-123456789101',
        'ISBN': 'ISBN-123456789101',
        'UPC': 'UPC-123456789101'
      }
      var expected = {
        'id': '20169',
        productIdentifier: {
          1: {
            productIdType: 'ISBN',
            productId: 'ISBN-123456789101'
          },
          2: {
            productIdType: 'UPC',
            productId: 'UPC-123456789101'
          },
          3: {
            productIdType: 'GTIN',
            productId: 'GTIN-123456789101'
          },
          4: {
            productIdType: 'EAN',
            productId: 'EAN-123456789101'
          }
        }
      }
      ItemHooksHandler.processProductId(preMapData)
      assert.deepEqual(expected, preMapData)
      return done()
    })

    it('should delete if no productIdentifiers found', function (done) {
      var ItemHooksHandler = new ItemHooks()
      var preMapData = {
        'productIdentifier' : []
      }
      ItemHooksHandler.processProductId(preMapData)
      assert.equal(preMapData.hasOwnProperty('productIdentifier'), false)
      return done()
    })

  })

  describe('validateHttpConnection Tests', function () {
    var options = {
      bearerToken: 'bearerToken',
      connectionId: 'v1/connections/1263',
      settings: {
        commonresources: {
          "walmartHttpConnectionId": "5d13771ba4577a69e0398622"
        }
      }
    }

    it('Should return empty callback if body doesnt have errors', function (done) {
      var params = _.cloneDeep(options)
      var ItemHooksHandler = new ItemHooks()
      nock.cleanAll()
      nock(WALMART_CONSTANTS.HERCULES_BASE_URL)
        .persist()
        .get('/v1/connections/5d13771ba4577a69e0398622/ping')
        .reply(201, { success: true })
      params.retryCount = 0
      ItemHooksHandler.validateHttpConnection(params, function (err) {
        assert.equal(JSON.stringify(err), JSON.stringify(null))
        done()
      })
    })

    it('Should throw an error if response is having errors', function (done) {
      this.timeout(150000)
      var params = _.cloneDeep(options)
      var ItemHooksHandler = new ItemHooks()
      nock.cleanAll()
      nock(WALMART_CONSTANTS.HERCULES_BASE_URL)
        .persist()
        .get('/v1/connections/5d13771ba4577a69e0398622/ping')
        .reply(201, { success: true, errors: [] })
      params.retryCount = 0
      ItemHooksHandler.validateHttpConnection(params, function (err) {
        assert.deepEqual(err.message, 'Unable to ping Walmart HTTP connection. Please contact Celigo support.')
        done()
      })
    })

    it('Should throw error if connection is unable to ping', function (done) {
      this.timeout(150000)
      var params = _.cloneDeep(options)
      var ItemHooksHandler = new ItemHooks()
      nock.cleanAll()
      nock(WALMART_CONSTANTS.HERCULES_BASE_URL)
        .persist()
        .post('/v1/connections/5d13771ba4577a69e0398622/ping')
        .reply(201, [{ 'code': 'name', 'errors': 'errors' }])
      params.retryCount = 0
      ItemHooksHandler.validateHttpConnection(params, function (err) {
        assert.deepEqual(err.message, 'Unable to ping Walmart HTTP connection. Please contact Celigo support.')
        done()
      })
    })

    it('Should return 200 response even if firts ping call failed', function (done) {
      this.timeout(150000)
      var params = _.cloneDeep(options)
      var ItemHooksHandler = new ItemHooks()
      nock.cleanAll()
      nock(WALMART_CONSTANTS.HERCULES_BASE_URL)
          .get('/v1/connections/5d13771ba4577a69e0398622/ping')
          .reply(422, { 'code': 'name', 'errors': 'errors' })
          .get('/v1/connections/5d13771ba4577a69e0398622/ping')
          .reply(201, [{ 'code': 'name'}])
      params.retryCount = 0
      ItemHooksHandler.validateHttpConnection(params, function (err, body) {
        assert.deepEqual(JSON.stringify(body), '[{"code":"name"}]')
        done()
      })
    })

    it('should throw an error if walmartHttpConnectionId is not found', function (done) {
      var params = _.cloneDeep(options)
      var ItemHooksHandler = new ItemHooks()
      delete params.settings.commonresources
      params.retryCount = 0
      ItemHooksHandler.validateHttpConnection(params, function (err) {
        assert.deepEqual(err.message, 'Walmart HTTP connection id not found. Please contact Celigo support.')
        done()
      })
    })
  })
  
  describe('splitCategoryId Tests', function () {

    it('should do the preMapProcessing, name splitting correctly for category', function (done) {
      var ItemHooksHandler = new ItemHooks()
      var preMapData = {
        'id': '20169',
        'Category Id': 'SportsAndRecreation.SportsAndRecreationOther'
      }
      var expected = {
        'id': '20169',
        'Category Id': 'SportsAndRecreationOther'
      }
      ItemHooksHandler.splitCategoryId(preMapData)
      assert.deepEqual(expected, preMapData)
      return done()
    })

    it('should return if categoryIdLabel is missing', function (done) {
      var preMapDataNode = {
        'id': '20169'
      }
      var itemHooks = new ItemHooks()
      var actual = itemHooks.splitCategoryId(preMapDataNode)
      assert.deepEqual(actual,null)
      done()
    })

    it('should return if preMapDataNode is null', function (done) {
      var preMapDataNode = null
      var itemHooks = new ItemHooks()
      var actual = itemHooks.splitCategoryId(preMapDataNode)
      assert.deepEqual(actual,null)
      done()
    })

  })

  it('should give the error message for wrong processMode', function (done) {
    var ItemHooksHandler = new ItemHooks()
    var preMapData = {
      'id': '20169',
      'processMode': 'Create'
    }
    var expected = {
      'source': 'adaptor',
      'name': 'ITEM_EXPORT_ERROR',
      'message': 'Invalid process mode. The process mode can only be one of CREATE, REPLACE_ALL, PARTIAL_UPDATE'
    }
    try {
      ItemHooksHandler.validateMandatoryFields(preMapData)
    } catch (ex) {
      assert.deepEqual(expected, ex)
    }
    return done()
  })

  it('should give the error message for the missing mandatory fields', function (done) {
    var ItemHooksHandler = new ItemHooks()
    var preMapData = {
      'id': '20169'
    }
    var expected = {
      'source': 'adaptor',
      'name': 'ITEM_EXPORT_ERROR',
      'message': 'Missing mandatory fields# sku, processMode, Replace Offer, productIdentifier, Category Id, Root Category Id, productName, shortDescription, brand, mainImageUrl'
    }
    try {
      ItemHooksHandler.validateMandatoryFields(preMapData)
    } catch (ex) {
      assert.deepEqual(expected, ex)
    }
    return done()
  })

  it('should give the error message for the missing mandatory fields and offer fields', function (done) {
    var ItemHooksHandler = new ItemHooks()
    var preMapData = {
      'id': '20169',
      'processMode': 'CREATE'
    }
    var expected = {
      'source': 'adaptor',
      'name': 'ITEM_EXPORT_ERROR',
      'message': 'Missing mandatory fields# sku, Replace Offer, productIdentifier, Category Id, Root Category Id, productName, shortDescription, brand, mainImageUrl'
    }
    try {
      ItemHooksHandler.validateMandatoryFields(preMapData)
    } catch (ex) {
      assert.deepEqual(expected, ex)
    }
    return done()
  })

  it('should not give the error message when all mandatory fields are present', function (done) {
    var ItemHooksHandler = new ItemHooks()
    var preMapData = {
      'id': '20169',
      'sku': 'sku',
      'processMode': 'CREATE',
      'Replace Offer': true,
      'productIdentifier': {
        'productId': '12345678901',
        'productIdType' : 'GTIN'
      },
      'Category Id': 'some id',
      'Root Category Id': 'some id',
      'productName': 'some name',
      'shortDescription': 'some description',
      'brand': 'some brand',
      'mainImageUrl': 'https://someurl.com',
      'price': '12.5',
      'ShippingWeight': {
        measure : '12',
        unit: 'lb'
      },
      'ProductTaxCode': '12345'
    }
    try {
      ItemHooksHandler.validateMandatoryFields(preMapData)
    } catch (ex) {
      assert.deepEqual(null, ex)
    }
    return done()
  })

  it('should give error with empty or null mandatory fields', function (done) {
    var ItemHooksHandler = new ItemHooks()
    var preMapData = [{
      'id': '20169',
      'sku': '1',
      'processMode': 'CREATE',
      'Replace Offer': true,
      'productIdType_1': '',
      'productId_1': '',
      'Category Id': '',
      'Root Category Id': null,
      'productName': '',
      'shortDescription': '',
      'brand': null,
      'mainImageUrl': '',
      'price': '',
      'ShippingWeight': null,
      'ShippingWeightUnit': null,
      'ProductTaxCode': null
    }, {
      'id': '20170',
      'sku': '',
      'processMode': 'CREATE',
      'Replace Offer': true,
      'productIdType_1': '',
      'productId_1': '',
      'Category Id': '',
      'Root Category Id': null,
      'productName': '',
      'shortDescription': '',
      'brand': null,
      'mainImageUrl': '',
      'price': '',
      'ShippingWeight': {
        'measure': 'M',
        'unit': null
      },
      'ProductTaxCode': null
    }]
    var expected = [{
      'source': 'adaptor',
      'name': 'ITEM_EXPORT_ERROR',
      'message': 'Missing mandatory fields# productIdentifier, Category Id, Root Category Id, productName, shortDescription, brand, mainImageUrl'
    }, {
      'source': 'adaptor',
      'name': 'ITEM_EXPORT_ERROR',
      'message': 'Missing mandatory fields# sku, productIdentifier, Category Id, Root Category Id, productName, shortDescription, brand, mainImageUrl'
    }]
    _.each(preMapData, function (data, index) {
      try {
        ItemHooksHandler.validateMandatoryFields(data)
      } catch (ex) {
        assert.deepEqual(expected[index], ex)
      }
    })
    return done()
  })

  it('should add product or offer as per the process modes', function (done) {
    var preMapData = [
      {'processMode': 'CREATE', 'Replace Offer': true},
      {'processMode': 'CREATE', 'Replace Offer': false},
      {'processMode': 'PARTIAL_UPDATE', 'Replace Offer': true},
      {'processMode': 'PARTIAL_UPDATE', 'Replace Offer': false},
      {'processMode': 'REPLACE_ALL', 'Replace Offer': true},
      {'processMode': 'REPLACE_ALL', 'Replace Offer': false}
    ]

    var expected = [
      { 'processMode': 'CREATE', 'Replace Offer': true, 'addProduct': true, 'addOffer': true },
      { 'processMode': 'CREATE', 'Replace Offer': false, 'addProduct': true, 'addOffer': true },
      { 'processMode': 'PARTIAL_UPDATE', 'Replace Offer': true, 'addProduct': true },
      { 'processMode': 'PARTIAL_UPDATE', 'Replace Offer': false, 'addProduct': true },
      { 'processMode': 'REPLACE_ALL', 'Replace Offer': true, 'addProduct': true, 'addOffer': true },
      { 'processMode': 'REPLACE_ALL', 'Replace Offer': false, 'addProduct': true }
    ]

    _.each(preMapData, function (preMapDataNode) {
      var itemHooks = new ItemHooks()
      itemHooks.addProductOfferNodes(preMapDataNode)
    })
    assert.deepEqual(expected, preMapData)
    done()
  })

  describe(' for itemProcessModeHandlingBeforeSubmit', function () {
    var options = {
      bearerToken: 'bearerToken',
      _importId: '_importId',
      settings: {
        'storemap': [{
          'imports': ['_importId'],
          'apiIdentifierSingleItemExportAdaptor': 'ecc1916b1e',
          'apiIdentifierItemStatusImportAdaptor': 'e6522ea4f0',
          'accountid': 'accountid'
        }]
      }
    }

    var data = [
      {data: { 'id': '1', 'sku': 'sku1', 'Account ID': '123', 'processMode': 'CREATE' }},
      {data: { 'id': '2', 'sku': 'sku2', 'Account ID': '123', 'processMode': 'PARTIAL_UPDATE' }},
      {data: { 'id': '3', 'sku': 'sku3', 'Account ID': '123', 'processMode': 'REPLACE_ALL' }},
      {data: { 'id': '4', 'sku': 'sku4', 'Account ID': '123', 'processMode': '' }},
      {data: { 'id': '5', 'sku': 'sku5', 'Account ID': '123', 'processMode': 'CREATE' }},
      {errors: [{'code': 'code', 'message': 'message'}]}
    ]
    afterEach(function (done) {
      nock.cleanAll()
      done()
    })

    it('Should update the processMode', function (done) {
      var walmartItemHooks = new ItemHooks()
      var expected = [
        {data: { 'id': '1', 'sku': 'sku1', 'Account ID': '123', 'processMode': 'PARTIAL_UPDATE', 'ingestionStatus': 'SUCCESS' }},
        {data: { 'id': '2', 'sku': 'sku2', 'Account ID': '123', 'processMode': 'PARTIAL_UPDATE' }},
        {data: { 'id': '3', 'sku': 'sku3', 'Account ID': '123', 'processMode': 'REPLACE_ALL' }},
        {data: { 'id': '4', 'sku': 'sku4', 'Account ID': '123', 'processMode': '' }},
        {data: { 'id': '5', 'sku': 'sku5', 'Account ID': '123', 'processMode': 'CREATE' }},
        {errors: [{'code': 'code', 'message': 'message'}]}
      ]

      nock(WALMART_CONSTANTS.HERCULES_BASE_URL).post('/ecc1916b1e').times(2).reply(function (uri, requestBody) {
        if (requestBody.sku.indexOf('sku1') > -1) {
          return [200, {'data': [{'publishedStatus': 'STAGE', 'wpid': '5N1PHQRUJ7EH'}]}]
        } else {
          return [422,
            {
              'errors': [{
                'code': 404,
                'message': 'CONTENT_NOT_FOUND.GMP_ITEM_QUERY_API',
                'source': 'marketplace.walmartapis.com'
              }]
            }
          ]
        }
      })

      nock(WALMART_CONSTANTS.HERCULES_BASE_URL).post('/e6522ea4f0').reply(function (uri, requestBody) {
        requestBody = JSON.parse(JSON.stringify(requestBody))
        if (requestBody && requestBody.length === 1 && requestBody[0].id === '1') {
          return [200, [{'statusCode': 200, 'id': 1, '_json': { 'id': 1 }}]]
        } else return [422]
      })

      walmartItemHooks.itemProcessModeHandlingBeforeSubmit(options, data, function (err, preMapData) {
        if (err) return done(err)
        assert.deepEqual(expected, data)
        return done()
      })
    })

    it('Should throw an exception if call to NetSuite to update/create the item account id map records is not made', function (done) {
      var walmartItemHooks = new ItemHooks()
      var expected = "Could not make network call. Nock: No match for request {\n  \"method\": \"POST\",\n  \"url\": \"https://api.integrator.io/e6522ea4f0\",\n  \"headers\": {\n    \"authorization\": \"Bearer bearerToken\",\n    \"content-type\": \"application/json\",\n    \"host\": \"api.integrator.io\",\n    \"accept\": \"application/json\",\n    \"content-length\": 2\n  },\n  \"body\": \"[]\"\n}"

      nock(WALMART_CONSTANTS.HERCULES_BASE_URL).post('/ecc1916b1e').times(2).reply(function (uri, requestBody) {
        if (requestBody.sku.indexOf('sku1') > -1) {
          return [200, {}]
        } else {
          return [422, {}]
        }
      })

      walmartItemHooks.itemProcessModeHandlingBeforeSubmit(options, data, function (err, preMapData) {
        assert.deepEqual(err.message, expected)
        return done()
      })
    })    
  })

  describe(' for variation', function (done) {
    it('should validate either all mandatory variation fields are present or none', function (done) {
      var preMapData = [
        {isPrimaryVariant: 'Yes', variantGroupId: '123', variantAttributeNames: 'color,size'},
        {isPrimaryVariant: 'No', variantGroupId: '123', variantAttributeNames: 'color,size'},
        {isPrimaryVariant: '', variantGroupId: '123', variantAttributeNames: 'color,size'},
        {isPrimaryVariant: 'Yes', variantGroupId: '', variantAttributeNames: 'color,size'},
        {isPrimaryVariant: 'Yes', variantGroupId: '123', variantAttributeNames: ''},
        {isPrimaryVariant: 'No', variantGroupId: '', variantAttributeNames: ''},
        {isPrimaryVariant: '', variantGroupId: '', variantAttributeNames: ''},
        {isPrimaryVariant: 'Yes', variantGroupId: '', variantAttributeNames: ''}
      ]

      var expected = [
        {'isPrimaryVariant': 'Yes', 'variantGroupId': '123', 'variantAttributeNames': 'color,size'},
        {'isPrimaryVariant': 'No', 'variantGroupId': '123', 'variantAttributeNames': 'color,size'},
        'Missing one or more of isPrimaryVariant, variantGroupId or variantAttributeNames, data={"isPrimaryVariant":"","variantGroupId":"123","variantAttributeNames":"color,size"}',
        'Missing one or more of isPrimaryVariant, variantGroupId or variantAttributeNames, data={"isPrimaryVariant":"Yes","variantGroupId":"","variantAttributeNames":"color,size"}',
        'Missing one or more of isPrimaryVariant, variantGroupId or variantAttributeNames, data={"isPrimaryVariant":"Yes","variantGroupId":"123","variantAttributeNames":""}',
        {'isPrimaryVariant': '', 'variantGroupId': '', 'variantAttributeNames': ''},
        {'isPrimaryVariant': '', 'variantGroupId': '', 'variantAttributeNames': ''},
        'Missing one or more of isPrimaryVariant, variantGroupId or variantAttributeNames, data={"isPrimaryVariant":"Yes","variantGroupId":"","variantAttributeNames":""}'
      ]

      var result = []

      _.each(preMapData, function (preMapDataNode) {
        var itemHooks = new ItemHooks()
        try {
          itemHooks.validateMandatoryVariationFields(preMapDataNode)
          result.push(preMapDataNode)
        } catch (ex) {
          result.push(ex.message)
        }
      })

      assert.deepEqual(result, expected)
      done()
    })

    it('should split variation names string into array', function (done) {
      var preMapDataNode = { variantAttributeNames: 'color,size,height' }
      var expected = {'variantAttributeNames': ['color', 'size', 'height']}

      var itemHooks = new ItemHooks()
      itemHooks.formatVariationNamesArray(preMapDataNode)
      assert.deepEqual(preMapDataNode, expected)
      done()
    })

    it('should return  if no variant attribute names in the preMapData node', function (done) {
      var preMapDataNode = {}
      var itemHooks = new ItemHooks()
      itemHooks.formatVariationNamesArray(preMapDataNode)
      assert.deepEqual(preMapDataNode, {})
      done()
    })

    it('should add variation nodes to preMapData', function (done) {
      var preMapDataNode = {variation_variationAttribute: { color: 'red', size: 'X/S' }, color: 'green'}
      var expected = {'color': 'red', 'size': 'X/S'}
      var itemHooks = new ItemHooks()

      this.walmartItemSettings = {options: { bearerToken: 'abcd', data: {}, connectionType: 'http' }}
      itemHooks.processVariationMappings.call(this, preMapDataNode)
      assert.deepEqual(preMapDataNode, expected)
      done()
    })

    it('should return if no variationAttributes inside preMapDataNode', function (done) {
      var preMapDataNode = {}
      var itemHooks = new ItemHooks()
      this.walmartItemSettings = { options: { bearerToken: 'abcd', data: {}, connectionType: 'http' } }
      itemHooks.processVariationMappings.call(this, preMapDataNode)
      assert.deepEqual(preMapDataNode, {})
      done()
    })
  })

  describe('processItemCategoryMappings Tests', function () {

    it('should return empty array for empty object', function (done) {
      var itemHooks = new ItemHooks()
      itemHooks.processItemCategoryMappings({}, function (err,res) {
        assert.deepEqual(res, [])
        done()
      })
    })

  })

  describe('attachErrorToAllItemRecords  tests', function () {
    var dataArray = [
      {
        'SKU': '123',
        errors: []
      }
    ]
    var err = {
      code: 'error',
      message: 'message'
    }

    it('should return null if no data array', function (done) {
      var itemHooks = new ItemHooks()
      var err = null
      itemHooks.attachErrorToAllItemRecords(err, {})
      assert.equal(err, null)
      done()
    })

    it('should return dataArray after attaching the errors to it with error name if dataArray doesnt have errors', function (done) {
      var itemHooks = new ItemHooks()
      var params = _.cloneDeep(dataArray)
      var err2 = _.cloneDeep(err)
      delete params[0].errors
      delete params[0].SKU
      delete err2.code
      err2.name = 'name'
      var expected = [
        {
          "code": "name",
          "message": "Failed to process Item with SKU : null due to following error : message"
        }
      ]

      itemHooks.attachErrorToAllItemRecords(err2, params)
      assert.deepEqual(params[0].errors, expected)
      done()
    })

    it('should return dataArray after attaching the errors to it if dataArray doesnt have errors and the error without code and name ', function (done) {
      var itemHooks = new ItemHooks()
      var params = _.cloneDeep(dataArray)
      var err2 = _.cloneDeep(err)
      delete err2.code
      var expected = [
        {
          "code": 'UNABLE_TO_MAP',
          "message": 'Failed to process Item with SKU : 123 due to following error : message'
        }
      ]
      itemHooks.attachErrorToAllItemRecords(err2, params)
      assert.deepEqual(params[0].errors, expected)
      done()
    })

    it('should return dataArray after attaching the errors to it if dataArray have errors', function (done) {
      var itemHooks = new ItemHooks()
      var expected = [{
        SKU: '123',
        errors:
          [{
            code: 'error',
            message: 'Failed to process Item with SKU : 123 due to following error : message'
          }]
      }]
      itemHooks.attachErrorToAllItemRecords(err, dataArray)
      assert.deepEqual(dataArray, expected)
      done()
    })
  })
})
