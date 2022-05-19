'use strict'

var AbstractVersionUpdate = require('connector-utils').AbstractVersionUpdate
var util = require('util')
var installerHelperUtil = require('connector-utils').installerUtils
var _ = require('lodash')
var logger = require('winston')

function VersionUpdater(options) {
    this.updateLogic = updatelogic
    AbstractVersionUpdate.call(this, options)
}

util.inherits(VersionUpdater, AbstractVersionUpdate)

//JIRA - WLMTNS-179 Enhance On-Demand Order import setting tooltip.
var updatelogic = function (callback) {
    var that = this
    var integration = that._integration
    var integrationId = that._integrationId
    logger.info('integrationId:' + integrationId + ', Inside updatelogic 1.11.7')

    if (!integration || !integration.settings || !integration.settings.commonresources || !integration.settings.sections || !integration.settings.storemap || !integration._id || !integration.settings.connectorEdition) {
        return callback(new Error('integrationId=' + integrationId + '. Integration is corrupted, Missing integration OR settings OR common sections OR storemap OR connectorEdition.'))
    }

    try {
        updateOnDemandOrderImportSettingTooltip.call(that, callback)
    } catch (ex) {
        return callback(ex)
    }
}

var updateOnDemandOrderImportSettingTooltip = function (callback) {
    var that = this
    var integration = that._integration

    logger.info('integrationId:' + integration._id + ', updateOnDemandOrderImportSettingTooltip, started')
    try {
        _.each(integration.settings.sections, function (eachStore) {
            if (eachStore.shopInstallComplete !== 'true') return
            if (!eachStore.sections || _.isEmpty(eachStore.sections) || !_.isArray(eachStore.sections)) throw new Error('Unable to find sections in store id#' + eachStore.id + ' for integration #id' + integration._id + ', Integration seems corrupted.')
            var orderSection = _.find(eachStore.sections, function (section) {
                return section.title === 'Order'
            })

            if (!orderSection) throw new Error('Unable to find Order section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
            if (!orderSection.sections || _.isEmpty(orderSection.sections) || !_.isArray(orderSection.sections)) throw new Error('Corrupted order section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted')

            var orderSubSection = _.find(orderSection.sections, function (section) {
                return section.title === 'Orders'
            })

            if (!orderSubSection || !orderSubSection.fields || !_.isArray(orderSubSection.fields)) throw new Error('Unable to find order sub section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
            var onDemandOrderIdSetting = _.find(orderSubSection.fields, function (field) {
                return field.label === 'Walmart Order Id(s)'
            })
            if (!onDemandOrderIdSetting) throw new Error('Unable to find on demand orderId setting in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
            if (onDemandOrderIdSetting.label && onDemandOrderIdSetting.tooltip) {
                onDemandOrderIdSetting.label = 'On-demand order sync'
                onDemandOrderIdSetting.tooltip = 'Provide up to 10 purchase order numbers separated by a comma (,). Click Save to perform on-demand sync of orders from Walmart to NetSuite. To know more, refer <a href=\'https://celigosuccess.zendesk.com/hc/en-us/articles/230170548-Walmart-Order-to-NetSuite-Order-Add\'>here</a>.'
            }
        })
    }
    catch (exception) {
        installerHelperUtil.logInSplunk('UpdateCodeRepo Error for integration #id :' + integration._id + ' , Inside updateOnDemandOrderImportSettingTooltip method | Error : ' + exception.message ? exception.message : exception, 'info')
        return callback(exception)
    }
    logger.info('integrationId:' + integration._id + ', updateOnDemandOrderImportSettingTooltip, end')
    return callback()
}

exports.VersionUpdater = VersionUpdater
