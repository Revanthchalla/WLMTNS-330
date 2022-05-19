'use strict'

var _ = require('lodash')
, CONNECTOR_CONSTANTS = require('abstract-connector').CONNECTOR_CONSTANTS
, path = require('path')
, basePath = path.join(__dirname, '../')

, INSTALLER_CONSTANTS = {
      CONNECTOR_BASE_PATH: basePath
    , INSTALL_CONNECTOR_METADATA : basePath + '/configs/meta/installerFunction'
    , VERIFY_PRODUCT_CONNECTION_METADATA : basePath + '/configs/meta/verifyProductConnection'
    , VERIFY_PRODUCT_BUNDLE_METADATA : basePath + '/configs/meta/verifyProductInstall'
    , ADD_NEW_STORE_WIZARD_METADATA: basePath + '/configs/wizards/addNewAccountWizard'
    , ADD_NEW_STORE_METADATA: basePath + '/configs/meta/addNewAccount'
    , EDITION_INSENSITIVE: true
    , VALID_EDITIONS: ['starter', 'standard']
    , PRODUCT_CONNECTION_NAME: 'walmartConnectionId'
    , CONNECTOR_BUNDLE_ID: '140400'
    , BUNDLE_SOURCE_ACCOUNT_ID : 'TSTDRV916910'
    , CONNECTOR_BUNDLE_INSTALLATION_SCRIPT_ID: 'customscript_celigo_wlmrt_bundle_install'
    , VERIFY_PRODUCT_CONNECTION_UPDATE_RECORD : 'walmartintegration-completestep-walmartconnection'
    , CONNECTOR_TOUR_DATA: basePath + '/configs/tour'
  }
, WALMART_CONSTANTS = {
      PAGE_SIZE_LIMIT: '10'
      , WALMART_BASE_URL: 'https://marketplace.walmartapis.com/'
      , V2_API_VERSION_IDENTIFIER : 'v2'
      , V3_API_VERSION_IDENTIFIER : 'v3'
      , WALMART_TEST_CUSTOMER_EMAIL_IDS: ['testmarketplaceceligo@gmail.com', 'testmarketplaceceligo2@gmail.com']
      , ORDER_SHIPPING_CHARGE_TYPE : 'SHIPPING'
      , ORDER_PRODUCT_CHARGE_TYPE : 'PRODUCT'
      , WALMART_SERVICE_NAME : 'Walmart Marketplace'
      , REQUEST_HEADER_SERVICE_NAME : 'WM_SVC.NAME'
      , REQUEST_HEADER_CORRELATION_ID : 'WM_QOS.CORRELATION_ID'
      , REQUEST_HEADER_TIMESTAMP : 'WM_SEC.TIMESTAMP'
      , REQUEST_HEADER_AUTH_SIGNATURE : 'WM_SEC.AUTH_SIGNATURE'
      , REQUEST_HEADER_CONSUMER_ID : 'WM_CONSUMER.ID'
      , REQUEST_HEADER_CHANNEL_TYPE : 'WM_CONSUMER.CHANNEL.TYPE'
      , REQUEST_HEADER_AUTHORIZATION : 'Authorization'
      , REQUEST_HEADER_ACCESS_TOKEN : 'WM_SEC.ACCESS_TOKEN'
      , WALMART_ORDER_IMPORT_FLOW_HANDLER_IDENTIFIER : 'WalmartOrderImportHandler'
      , WALMART_ORDER_ACK_FLOW_HANDLER_IDENTIFIER : 'WalmartOrderAcknowledgementExportHandler'
      , WALMART_PRICING_EXPORT_FLOW_HANDLER_IDENTIFIER : 'WalmartPricingExportHandler'
      , WALMART_INVENTORY_EXPORT_FLOW_HANDLER_IDENTIFIER : 'WalmartInventoryExportHandler'
      , WALMART_FULFILLMENT_EXPORT_FLOW_HANDLER_IDENTIFIER : 'WalmartFulfillmentExportHandler'
      , WALMART_CONNECTORID: '57dbed962eca42c50e6e22be'
      , WALMART_HTTP_TOKEN_RELATIVEURI: '/token'
      , CONNECTION_CONSUMER_ID_IDENTIFIER : 'walmartConsumerId'
      , NS_CONNECTOR_UTIL_SCRIPTID: 'customscript_celigo_nsconnectorutil'
      , NS_CONNECTOR_UTIL_DEPLOYID: 'customdeploy_celigo_nsconnectorutil'
      , WALMART_ORDER_IMPORT_ADAPTOR_ID : 'walmart-order-import-adaptor'
      , ORDER_IMPORT_CUSTOMER_MAPPING_FIELD_ID : 'netSuiteCustomerId'
      , DEFAULT_CUSTOMER_SETTING_FIELD : 'setDefaultCustomerId'
      , WALMART_VALID_FULFILLMENT_CARRIER_NAMES : ['UPS', 'USPS', 'FedEx', 'Airborne', 'OnTrac', 'DHL', 'NG', 'LS', 'UDS', 'UPSMI', 'FDX'] //Based on https://developer.walmart.com/#/apicenter/marketPlace/v3#shippingNotificationsUpdates
      , STORE_IDENTIFY_STORE_MAP_ATTR: 'shopInstallComplete'
      , STORE_IDENTIFY_SECTION_ATTR: 'shopInstallComplete'
      , STORE_IDENTIFY_VALUE: 'false'
      , UPGRADE_STORE_IDENTIFY_STORE_MAP_ATTR: 'accountid'
      , UPGRADE_STORE_IDENTIFY_SECTION_ATTR: 'id'
      , NOSTORE_LICENSE: 'Adding another Walmart account requires a license to be installed. Please contact Celigo sales.'
      , STORE_ID_IDENTIFIER: 'accountid'
      , STORE_NAME_IDENTIFIER: 'accountname'
      , TEMPLATES_FOLDERPATH: basePath + '/templates/'
      , TEMPLATES_JSON_FOLDERNAME: 'json'
      , TEMPLATES_HANDLEBAR_FOLDERNAME: 'handlebar'
      , TEMPLATES_EXCEL_FOLDERNAME: 'excel'
      , TAX_SETTINGS: {
        NETSUITE_CALCULATES: 'NETSUITE_CALCULATES',
        OVERRIDE_TAX_TOTALS: 'OVERRIDE_TAX_TOTALS',
        TOTAL_TAX_AGAINST_SINGLE_LINE: 'TOTAL_TAX_AGAINST_SINGLE_LINE'
      }
      , UPDATE_CODE_REPO: basePath + '/updateCodeRepo'
      , ACCESSTOKEN_ERROR_STATUSCODE: []
      , INTEGRATION_JSON_KEYS: [
        "walmartintegration-load",
        "walmartintegration-load-to-saveaccountdetails"
      ]
    }

_.each(INSTALLER_CONSTANTS, function(v, k) {
  if(!WALMART_CONSTANTS.hasOwnProperty(k))
    WALMART_CONSTANTS[k] = v
})

_.each(CONNECTOR_CONSTANTS, function(v, k) {
  if(!WALMART_CONSTANTS.hasOwnProperty(k))
    WALMART_CONSTANTS[k] = v
})

if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'development') {
  WALMART_CONSTANTS.CONNECTOR_BUNDLE_ID =  '136333'
  WALMART_CONSTANTS.BUNDLE_SOURCE_ACCOUNT_ID = 'TSTDRV840460'
}

if (process.env.NODE_ENV === 'staging') {
  WALMART_CONSTANTS.WALMART_CONNECTORID = '57b5c79c61314b461e1515b1'
} else if (process.env.NODE_ENV === 'development') {
  WALMART_CONSTANTS.WALMART_CONNECTORID = '59e1ed53243ea94180617716'
}

module.exports = WALMART_CONSTANTS
