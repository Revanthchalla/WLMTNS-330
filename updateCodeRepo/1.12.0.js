'use strict'

var installerUtils = require('connector-utils').installerUtils
var util = require('util')
var AbstractVersionUpdate = require('connector-utils').AbstractVersionUpdate
var updateConnectorUtil = require('abstract-connector').updateConnectorUtil

function VersionUpdater(options) {
    this.updateLogic = updatelogic
    AbstractVersionUpdate.call(this, options)
}

util.inherits(VersionUpdater, AbstractVersionUpdate)

/**
 * Properties of "This" object:
 *         _bearerToken
 *         _integrationId
 *         _integration
 *         _version
 */

var updatelogic = function (callback) {
    var that = this
    installerUtils.logInSplunk('message = Inside updatelogic 1.12.0', 'info')

    try {
        updateInventoryExportAdaptorBatchSize.call(that, callback)
    } catch (e) {
        installerUtils.logInSplunk('message=Exception occurred while executing the update code 1.12.0. Error = ' + e.message, 'info')
        return callback(e)
    }
}
/*Jira trackerId - WLM-247
 *WLM-247 Walmart Inventory Export Batchsize change 20 to 500 
 */
var updateInventoryExportAdaptorBatchSize = function (callback) {
    var that = this
    var integration = that._integration
    var integrationId = that._integrationId

    if (!integration || !integration.settings || !integration.settings.commonresources || !integration.settings.sections || !integration.settings.storemap || !integration._id || !integration.settings.connectorEdition) {
        return callback(new Error('Integration with integrationId=' + integrationId + 'is corrupted, Missing integration OR settings OR common sections OR storemap OR connectorEdition. Please contact Celigo Support'))
    }
    var updateBatchSize = function (exportAdaptor) {
        if (exportAdaptor && exportAdaptor.netsuite && exportAdaptor.netsuite.restlet) {
            if(!exportAdaptor.type || (exportAdaptor.type !== "delta")) return 
            exportAdaptor.netsuite.restlet.batchSize = 500 //update the batchSize for exportType Delta
        } else {
            installerUtils.logInSplunk('integrationId=' + integrationId + ', message=updateBatchSize, message= exportadaptor is corrupted.', 'info')
            return { error: 'Export adaptor ' + (exportAdaptor ? exportAdaptor._id : '') + 'is corrupted.' }
        }
    }

    updateConnectorUtil.modifyAdaptor({
        resourceType: 'exports',
        adaptorName: ['walmart-inventory-export-adaptor'],
        migrationThis: that,
        helperMethod: updateBatchSize
    }, callback)
}

exports.VersionUpdater = VersionUpdater
