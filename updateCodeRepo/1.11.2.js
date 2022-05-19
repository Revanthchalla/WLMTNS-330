'use strict'

var AbstractVersionUpdate = require('connector-utils').AbstractVersionUpdate
var util = require('util')
var installerHelperUtil = require('connector-utils').installerUtils
var _ = require('lodash')

function VersionUpdater (options) {
  this.updateLogic = updatelogic
  AbstractVersionUpdate.call(this, options)
}

util.inherits(VersionUpdater, AbstractVersionUpdate)

// Renaming connector to Integration App. JIRA - https://celigo.atlassian.net/browse/WLMTNS-225.
var updatelogic = function (callback) {
  installerHelperUtil.logInSplunk('Inside updatelogic 1.11.2', 'info')
  try {
    updateStarterEditionTooltips.call(this, callback)
  } catch (exception) {
    return callback(exception)
  }
}

var updateStarterEditionTooltips = function (callback) {
  var that = this
  var integration = that.getIntegration()
  try {
    integration.name = 'Walmart - NetSuite'
    // updating tooltips
    if (!integration.settings.sections || _.isEmpty(integration.settings.sections)) throw new Error('Unable to find store sections in the Integration, id#' + integration._id + ', Integration seems corrupted.')
    _.each(integration.settings.sections, function (eachStore) {
      if (eachStore.shopInstallComplete !== 'true') return
      if (!eachStore.sections || _.isEmpty(eachStore.sections)) throw new Error('Unable to find sections in store id#' + eachStore.id + ' for integration #id' + integration._id + ', Integration seems corrupted.')
      // billing section
      var billingSection = _.find(eachStore.sections, function (section) {
        return section.title === 'Billing'
      })

      if (!billingSection) throw new Error('Unable to find Billing section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
      if (!billingSection.fields || _.isEmpty(billingSection.fields)) throw new Error('Corrupted settlement section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted')

      var billingSubSection = _.find(billingSection.fields, function (field) {
        return field.label === 'Auto-bill orders in NetSuite when the status is'
      })

      if (billingSubSection) billingSubSection.tooltip = 'Provide the order status in NetSuite after which the Integration App should automatically bill the sales orders and create corresponding cash sales or invoices.'

      // updating order section
      var orderSection = _.find(eachStore.sections, function (section) {
        return section.title === 'Order'
      })

      if (!orderSection) throw new Error('Unable to find Order section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
      if (!orderSection.sections || _.isEmpty(orderSection.sections)) throw new Error('Corrupted fba order section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted')

      var orderSubSection = _.find(orderSection.sections, function (section) {
        return section.title === 'Orders'
      })

      if (!orderSubSection) throw new Error('Unable to find order sub section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
      var orderAutoAckSetting = _.find(orderSubSection.fields, function (field) {
        return field.label === 'Auto Acknowledge On Demand Orders'
      })
      if (orderAutoAckSetting) orderAutoAckSetting.tooltip = "If checked, Integration App auto acknowledges orders that are imported using the 'Walmart Order Id(s)'. Recommended approach is to keep this box unchecked before you go live with the Integration App & keep it checked once live in Production."

      // inventory section
      var inventorySection = _.find(eachStore.sections, function (section) {
        return section.title === 'Inventory'
      })

      if (!inventorySection) throw new Error('Unable to find Inventory section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted.')
      if (!inventorySection.fields || _.isEmpty(inventorySection.fields)) throw new Error('Corrupted inventory section in the store id#' + eachStore.id + ' for the integration #id' + integration._id + ', Integration seems corrupted')

      var kitInventorySetting = _.find(inventorySection.fields, function (field) {
        return field.label === 'Calculate Kit Inventory per Location'
      })

      if (kitInventorySetting) kitInventorySetting.tooltip = 'If enabled, Integration App will first calculate sellable inventory of kit per location using quantity of each member item, and then will send the sum of all the sellable quantities across all the locations. If disabled, Integration App will first calculate the total inventory for each member items across all the locations, and then will calculate inventory for a kit.'

      // updating tour
      if (integration.settings.tour) {
        var tourSettingsToUpdate = integration.settings.tour[0].steps
        var monitoringTour = _.find(tourSettingsToUpdate, function (tourSettings) {
          return tourSettings.title === 'Monitoring'
        })

        if (monitoringTour) monitoringTour.intro = 'This section allows you to share this Integration App with other Integrator.io users in read-only mode. They will have the ability to view jobs, errors, retries, and run flows.'
        var subscriptionTour = _.find(tourSettingsToUpdate, function (tourSettings) {
          return tourSettings.title === 'Subscription'
        })

        if (subscriptionTour) subscriptionTour.intro = 'This section gives you the details of the current edition of the Integration App and the license expiry date.'
        var uninstallTour = _.find(tourSettingsToUpdate, function (tourSettings) {
          return tourSettings.title === 'Uninstall'
        })
        if (uninstallTour) uninstallTour.intro = 'This section allows you to uninstall the Integration App from your account.'
      }
    })

    return callback(null, integration)
  } catch (exception) {
    installerHelperUtil.logInSplunk('UpdateCodeRepo Error for integration #id :' + integration._id + ' , Inside updateStarterEditionTooltips method | Error : ' + exception.message ? exception.message : exception , 'info')
    return callback(exception)
  }
}

exports.VersionUpdater = VersionUpdater
