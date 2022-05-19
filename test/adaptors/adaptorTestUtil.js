'use strict'

var testUtil = require('../testUtil.js').testUtil

var fileNameToPathMap =
{ 'exportAdaptorDeltaFlowOptions' : './test/data/adaptors/exportAdaptorDeltaFlowOptions.json'
, 'exportAdaptorTestFlowOptions' : './test/data/adaptors/exportAdaptorTestFlowOptions.json'
, 'importAdaptorHandlebarFlowOptions' : './test/data/adaptors/importAdaptorHandlebarFlowOptions.json'
, 'exportAdaptorDeltaFlowOptionsInvalidKey' : './test/data/adaptors/exportAdaptorDeltaFlowOptionsInvalidKey.json'
, 'orderAcknowledgementResponse' : './test/data/adaptors/orderAcknowledgementResponse.json'
}

var adaptorTestUtil = new testUtil(fileNameToPathMap)
adaptorTestUtil.loadFiles()

exports.adaptorTestUtil = adaptorTestUtil
