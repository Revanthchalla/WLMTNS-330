'use strict'

var testUtil = require('../testUtil.js').testUtil

var fileNameToPathMap =
{ 'orderSampleData' : './test/data/hooks/orderSampleData.json'
}

var hooksTestUtil = new testUtil(fileNameToPathMap)
hooksTestUtil.loadFiles()

exports.hooksTestUtil = hooksTestUtil
