'use strict'

var util = require('util')
var AbstractEtailNetSuiteUninstallHandler = require('abstract-connector').AbstractEtailNetSuiteUninstallHandler
var WalmartItemCategoryHandler = require('../handlers/walmartItemCategoryHandler')
var logger = require('winston')
var installerUtils = require('connector-utils').installerUtils
var _ = require('lodash')

function WalmartNetSuiteUninstallHandler(opts) {
    AbstractEtailNetSuiteUninstallHandler.call(this, opts)
}

util.inherits(WalmartNetSuiteUninstallHandler, AbstractEtailNetSuiteUninstallHandler)

WalmartNetSuiteUninstallHandler.prototype.getAccountRecordInternalId = function () {
    return 'customrecord_celigo_wlmrt_account_info'
}

//Remove records from NetSuite which are related to WAL-item export(catageory, variation, etail Mapping records)
//options: {integration: {}, batches: [{savedSearch: []},{customrecord_celigo_walio_account_info: []}], uninstallerConfig: {}}
WalmartNetSuiteUninstallHandler.prototype.preUninstallComponentsHook = function (options, callback) {
    var that = this
    var storemap = that.getStoreMap()
    if (storemap && storemap.shopInstallComplete === "true" && storemap.itemCategoryMappingsStorageImportAdaptor) {
        var importOptionsData =
        {
            'bearerToken': that.bearerToken,
            'resourcetype': 'imports',
            'id': storemap.itemCategoryMappingsStorageImportAdaptor
        }

        installerUtils.integratorRestClient(importOptionsData, function (err, res, body) {
            if (err) return callback(err)
            logger.debug('message=preUninstallComponentsHook, GET importOptionsData res=' + JSON.stringify(res))

            if (!body) return callback(new Error('Unable to fetch import# ' + storemap.itemCategoryMappingsStorageImportAdaptor + ' in preUninstallComponentsHook, res : ' + JSON.stringify(res)))
            logger.debug('message=preUninstallComponentsHook, storage import adaptor body=', JSON.stringify(body))
            if (!body.mapping || !body.mapping.lists) {
                logger.info('message=Categories are not configured for the store. Nothing is there to uninstall.')
                return callback(null, options.batches)
            }

            options.settings = options.integration.settings

            options.utilities = {
                "options": {
                    "_flowId": storemap.itemCategoryMappingsStorageImportAdaptor //Tweak, since deletecategories code expect flowId. Copying importId to flowId, can be added dummy id as well.
                }
            }
            options._importId = storemap.itemCategoryMappingsStorageImportAdaptor
            options.bearerToken = that.bearerToken
            var walmartItemCategoryHandler = new WalmartItemCategoryHandler({options: options})

            walmartItemCategoryHandler.deleteNetSuiteRecords(body.mapping.lists, function (e, r) {
                if (e) return callback(e)
                return callback(null, options.batches)
            })
        })
    } else {
        //for partially installed store accountid will be defaultaccountid.
        //Remove those values from customrecord_celigo_walio_account_info array.
        //eg: options:[{"name": "netsuite","batches": [{"savedSearches": ["12345", "56573", "32144"]}, {"customrecord_celigo_walio_account_info": ["defaultaccountid"]}]}]
        //output should be [{"name": "netsuite","batches": [{"savedSearches": ["12345", "56573", "32144"]}, {"customrecord_celigo_walio_account_info": []}]}]
        var defaultAccountIndex = -1
        _.each(options.batches, function (batch) {
            if (_.isEmpty(batch)) return
            defaultAccountIndex = batch[that.getAccountRecordInternalId()] ? batch[that.getAccountRecordInternalId()].indexOf(that.defaultStoreId) : -1
            if (defaultAccountIndex > -1) {
                batch[that.getAccountRecordInternalId()].splice(defaultAccountIndex, 1)
            }
        })
        return callback(null, options.batches)
    }
}

module.exports = WalmartNetSuiteUninstallHandler
