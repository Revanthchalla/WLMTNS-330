'use strict'
var fs = require('fs')
var xlsxParser = require('abstract-connector').xlsxJSONParser
var Attribute = require('abstract-connector').Attribute
var Category = require('abstract-connector').Category
var installerHelperUtil = require('connector-utils').installerUtils
var _ = require('lodash')
var logger = require('winston')
var WALMART_CONSTANTS = require('./walmartConstants')
var path = require('path')
var REPEAT_COUNT = 5
var FILTER_TYPE_MAP = {
  'Required': 'required',
  'Recommended': 'preferred',
  'Optional': 'optional',
  'Conditionally Required': 'conditional'
}
var DATA_DEFINITIONS_SHEET = 'Data Definitions'
var HIDDEN_SHEET = 'Hidden'
var ITEM_VARIANT_GROUP = 'Item Variants'

function WalmartMetaData (params) {
  params = params || {}
  this.marketPlaceDomain = params && params.marketPlaceDomain || 'US'
  this.categoryFileName = params.categoryFileName || null
  this.excelParser = params.excelParser || null
}
WalmartMetaData.prototype.getCategoryFileName = function () {
  return this.categoryFileName || null
}
WalmartMetaData.prototype.setCategoryFileName = function (categoryFileName) {
  this.categoryFileName = categoryFileName
}
WalmartMetaData.prototype.getCategoryProductTypeMap = function () {
  return this.productTypeMap || null
}
WalmartMetaData.prototype.setCategoryProductTypeMap = function (productTypeMap) {
  this.productTypeMap = productTypeMap
}
WalmartMetaData.prototype.getCategoryAttributeMap = function () {
  return this.attributeMap || null
}
WalmartMetaData.prototype.setCategoryAttributeMap = function (attributeMap) {
  this.attributeMap = attributeMap
}
WalmartMetaData.prototype.setSubGroups = function (subGroups) {
  this.subGroups = subGroups
}
WalmartMetaData.prototype.getSubGroups = function () {
  return this.subGroups || ['Basic', 'Images', 'Offer', 'Discoverability', 'Dimensions', 'Item Variants', 'Compliance', 'Additional Category Attributes', 'Nice to Have']
}
WalmartMetaData.prototype.getCommonSubGroups = function () {
  return this.commonSubGroups || ['Basic', 'Images', 'Offer', 'Discoverability', 'Dimensions', 'Item Variants', 'Compliance']
}
WalmartMetaData.prototype.getMetaDataSheetNames = function () {
  return this.metaDataSheetNames || ['Welcome', 'Settings', 'Instructions', 'Data Definitions', 'Hidden']
}
WalmartMetaData.prototype.getSubCategoryIdAndNameMap = function () {
  return this.subCategoryIdAndNameMap || null
}
WalmartMetaData.prototype.setSubCategoryIdAndNameMap = function (subCategoryIdAndNameMap) {
  this.subCategoryIdAndNameMap = subCategoryIdAndNameMap
}
WalmartMetaData.prototype.getDataDefinitionHeaders = function () {
  return {
    Group: 0,
    Attribute_Name: 1,
    Field_Name: 2,
    Definition: 3,
    Example_Values: 4,
    Valid_Values: 5,
    Requirement_Level: 6
  }
}
WalmartMetaData.prototype.getHiddenRowIds = function () {
  return {
    Attribute_Name: 0,
    Attribute_XML_Name: 1,
    Requirement_Level: 2,
    Conditional_Upon: 3,
    Data_Type: 4,
    Character_limitation: 5,
    Is_UOM: 6,
    Closed_List: 7,
    Member_XML: 8,
    Group_Name: 9,
    XSD_Group_Name: 10,
    Is_Multiselect: 11
  }
}
WalmartMetaData.prototype.getCommonAttributes = function () {
  var that = this
  return that.getCategoryMetaDataById('commonAttributes')
}
WalmartMetaData.prototype.getHardCodedAttributeMap = function () {
  return this.hardCodedAttributeMap || null
}
WalmartMetaData.prototype.setHardCodedAttributeMap = function (hardCodedAttributeMap) {
  this.hardCodedAttributeMap = hardCodedAttributeMap
}
WalmartMetaData.prototype.getExcelParser = function () {
  return this.excelParser || null
}
WalmartMetaData.prototype.setExcelParser = function (excelParser) {
  this.excelParser = excelParser
}
WalmartMetaData.prototype.getCategoryRelationshipData = function () {
  try {
    var categoryMetaData = installerHelperUtil.loadJSON(getMetaDataFolderPath(this.marketPlaceDomain) + 'categoriesMetaData')
    if (!categoryMetaData || _.isEmpty(categoryMetaData.categoryRelationshipData)) return []
    return categoryMetaData.categoryRelationshipData
  } catch (ex) {
    logger.info(ex)
    return []
  }
}
WalmartMetaData.prototype.getCategoryRelationshipDataById = function (id) {
  var categoriesMetaData = installerHelperUtil.loadJSON(getMetaDataFolderPath(this.marketPlaceDomain) + 'categoriesMetaData')
  if (!categoriesMetaData || _.isEmpty(categoriesMetaData.categoryRelationshipData)) return null
  return _.find(categoriesMetaData.categoryRelationshipData, function (child) {
    return child && child.id === id
  }) || null
}
WalmartMetaData.prototype.getCategoryHandlebarById = function (id) {
  try {
    var filePath = path.resolve(getHandlebarFolderPath(this.marketPlaceDomain), id + '.hbs')
    var data = fs.readFileSync(filePath)
    return data.toString()
  } catch (ex) {
    logger.info(ex)
    return ''
  }
}
WalmartMetaData.prototype.getCategoryMetaDataById = function (id, rootToCategoryPath, shouldReturnFullPathName, separatorString) {
  if (!id) return null
  var rootCategoryId
  try {
    if (rootToCategoryPath && rootToCategoryPath.length > 1) {
      rootCategoryId = rootToCategoryPath[0]
    } else {
      // assuming id is the rootCategory; hance rootToCategoryPath is not provided
      rootCategoryId = id
      rootToCategoryPath = []
    }
    var categoryMetaData = installerHelperUtil.loadJSON(getMetaDataFolderPath(this.marketPlaceDomain) + rootCategoryId)
    if (!categoryMetaData || _.isEmpty(categoryMetaData.generatesMetaData)) return null
    if (id === rootCategoryId) {
      return categoryMetaData.generatesMetaData
    }
    var response = {}
    var categoryName = ''
    var parent = categoryMetaData.generatesMetaData
    var arrayToSearch = parent.children
    if (shouldReturnFullPathName) {
      categoryName += parent.name + (separatorString || ' > ')
    }
    response = _.find(arrayToSearch, function (category) {
      return category && category.id === id
    }) || null
    if (response) {
      response.name = categoryName + response.name
    }
    return response
  } catch (ex) {
    logger.info('WalmartMetaData | getCategoryMetaDataById, Exception, Code: ' + ex.name + ', Message: ' + ex.message + ', ex: ' + JSON.stringify(ex))
    return null
  }
}
WalmartMetaData.prototype.getDataDefinitionsofAllAttributes = function (workBook) {
  var that = this
  var attributeIdDataDefinitionMap = {}
  var fieldName = null
  var groupName = null
  var dataDefinitionHeaders = that.getDataDefinitionHeaders()
  var row
  try {
    var dataDefWorkSheet = xlsxParser.getWorkSheet(workBook, DATA_DEFINITIONS_SHEET)
    for (var i = 1; i < dataDefWorkSheet.data.length; i++) {
      row = dataDefWorkSheet.data[i]
      fieldName = row[dataDefinitionHeaders.Field_Name]
      if (row[dataDefinitionHeaders.Group]) {
        groupName = row[dataDefinitionHeaders.Group].split('-')[0].trim()
        attributeIdDataDefinitionMap[groupName] = {}
      }
      attributeIdDataDefinitionMap[groupName][fieldName] = initializeNewAttribute({
        id: fieldName,
        name: row[dataDefinitionHeaders.Attribute_Name],
        description: row[dataDefinitionHeaders.Definition], // + '\nExample: ' + row[dataDefinitionHeaders.Example_Values],
        filterType: (row[dataDefinitionHeaders.Requirement_Level] || null),
        type: (row[dataDefinitionHeaders.Valid_Values] || null),
        options: (row[dataDefinitionHeaders.Valid_Values] || null)
      })
    }
  } catch (error) {
    logger.info(error)
  }
  return attributeIdDataDefinitionMap
}
WalmartMetaData.prototype.getSubCategorySheetMetaData = function (worksheet, subCategoryMetaData, commonGroupData) {
  var MetaRowOffset = 1
  var GroupNameRowOffset = 2
  var RepeatRowOffset = 3
  var ComplexAttributeRowOffset = 4
  var SimpleAttributeNameRowOffset = 5
  var SimpleAttributeIdRowOffset = 6
  var categoryToUpdate
  var that = this
  var subCategoryId = null
  if (!worksheet) return subCategoryId
  try {
    var MetaRow = worksheet.getRow(MetaRowOffset)
    var GroupNameRow = worksheet.getRow(GroupNameRowOffset)
    var RepeatRow = worksheet.getRow(RepeatRowOffset)
    var ComplexAttributeRow = worksheet.getRow(ComplexAttributeRowOffset)
    var SimpleAttributeNameRow = worksheet.getRow(SimpleAttributeNameRowOffset)
    var SimpleAttributeIdRow = worksheet.getRow(SimpleAttributeIdRowOffset)
    var prevGroupName = null
    var subCategoryMeta = MetaRow.getCell(3).value // Version=MP-wmspec-3.1,FootwearCategory,Footwear
    subCategoryId = subCategoryMeta.replace('Version=MP-wmspec-3.1,', '')
    subCategoryId = subCategoryId.split(',')[1]
    if (!subCategoryId) {
      throw new Error('subCategoryId not Found in Sheet Meta data')
    }
    SimpleAttributeIdRow.eachCell(function (cell, cellColumn) {
      var simpleAttributeId = SimpleAttributeIdRow.getCell(cellColumn).value
      var simpleAttributeName = SimpleAttributeNameRow.getCell(cellColumn).value
      var complexAttribute = ComplexAttributeRow.getCell(cellColumn).value
      var groupName = GroupNameRow.getCell(cellColumn).value || prevGroupName
      categoryToUpdate = subCategoryMetaData
      if (that.getCommonSubGroups().indexOf(groupName) > -1) {
        categoryToUpdate = commonGroupData
      }
      // logger.info(JSON.stringify({
      //   simpleAttributeId: simpleAttributeId,
      //   simpleAttributeName: simpleAttributeName,
      //   complexAttribute: complexAttribute,
      //   groupName: groupName
      // }))
      if (RepeatRow.getCell(cellColumn).value && RepeatRow.getCell(cellColumn).value === 'Add More') {
        // find if ComplexAttributeRow is populated
        if (complexAttribute && categoryToUpdate.complexTypeAddMores.indexOf(complexAttribute) === -1) {
          categoryToUpdate.complexTypeAddMores.push(complexAttribute)
        } else if (simpleAttributeName) {
          categoryToUpdate.simpleTypeAddMores.push(simpleAttributeId)
        }
      }
      if (!categoryToUpdate.AttributeCollection[groupName]) {
        categoryToUpdate.AttributeCollection[groupName] = {}
      }
      if (complexAttribute && complexAttribute.indexOf('(') > -1) {
        var complexAttr = complexAttribute
        var complexAttrName = complexAttr.split('(')[0].trim()
        var complexAttrId = complexAttr.split('(')[1].trim()
        complexAttrId = complexAttrId.replace(')', '')
        categoryToUpdate.AttributeCollection[groupName][complexAttrId + '.' + simpleAttributeId] = {
          name: [complexAttrName, simpleAttributeName].join(' > '),
          id: complexAttrId + '.' + simpleAttributeId
        }
      } else {
        categoryToUpdate.AttributeCollection[groupName][simpleAttributeId] = {
          name: simpleAttributeName,
          id: simpleAttributeId
        }
      }
      prevGroupName = groupName
    })
  } catch (error) {
    logger.info(error)
  }
  return subCategoryId
}
WalmartMetaData.prototype.parseAttributesWithHiddenSheet = function (workBook, attributeDataDefinitions, subCategoriesMetadata, categoryMetaData, commonAttribute) {
  var that = this
  try {
    var hiddenWorksheet = xlsxParser.getWorkSheet(workBook, HIDDEN_SHEET).data
    var hiddenRowIdentifiers = that.getHiddenRowIds()
    var commonAttributes = that.getCommonAttributes()
    for (var column = 1; column < hiddenWorksheet[hiddenRowIdentifiers.Attribute_Name].length; column++) {
      var xsdGroupName = hiddenWorksheet[hiddenRowIdentifiers.XSD_Group_Name][column]
      var attributeId = hiddenWorksheet[hiddenRowIdentifiers.Attribute_XML_Name][column]
      var groupName = hiddenWorksheet[hiddenRowIdentifiers.Group_Name][column] && hiddenWorksheet[hiddenRowIdentifiers.Group_Name][column].trim()
      var memberXml = hiddenWorksheet[hiddenRowIdentifiers.Member_XML][column]
      var isMultiSelect = hiddenWorksheet[hiddenRowIdentifiers.Is_Multiselect][column] === 'Y'
      var requirementLevel = hiddenWorksheet[hiddenRowIdentifiers.Requirement_Level][column]
      requirementLevel = FILTER_TYPE_MAP[requirementLevel] ? FILTER_TYPE_MAP[requirementLevel] : 'optional'
      // logger.info(JSON.stringify({
      //   xsdGroupName: xsdGroupName,
      //   attributeId: attributeId,
      //   groupName: groupName,
      //   memberXml: memberXml,
      //   isMultiSelect: isMultiSelect
      // }))
      // Remove CommonAttributes // Assess below subgroups as well, changes made at addCategoryAttributesDefinition ~L330
      // if (['MPItem', 'Offer', 'MPProduct'].indexOf(xsdGroupName) > -1) {
      //   continue
      // }
      // getCommonSubGroups
      if (that.getCommonSubGroups().indexOf(groupName) > -1 && xsdGroupName) {
        var itemVariant = false
        if (memberXml === "productIdentifier" && groupName === "Basic" && xsdGroupName === "MPItem") continue
        if (groupName === ITEM_VARIANT_GROUP) {
          // swatch images are also part of variation, these should be added in category attributes as well
          itemVariant = true
          if (attributeId === 'variantAttributeNames') {
            var attributeData = getAttributeDefinitionFromId(attributeDataDefinitions, attributeId, groupName)
            var variationAttributes = _.map(attributeData.options, function (option) {
              return {
                id: option.id,
                name: option.text
              }
            })
            _.each(subCategoriesMetadata, function (subCategoryMetaData, subCategoryName) {
              subCategoryMetaData.categoryRef.setVariationAttributes(variationAttributes)
            })
            continue
          }
          if (['variantGroupId', 'isPrimaryVariant'].indexOf(attributeId) >= 0) {
            continue
          }
        }
        addCategoryAttributesDefinition({
          memberXml: memberXml,
          isMultiSelect: isMultiSelect,
          attributeDataDefinitions: attributeDataDefinitions,
          attributeId: attributeId,
          groupName: groupName,
          itemVariant: itemVariant,
          categoryMetaData: commonAttribute,
          commonAttributes: commonAttributes,
          requirementLevel: requirementLevel,
          commonSubGroups: ['MPItem', 'Offer', 'MPProduct']
        })
      } else if (that.getCommonSubGroups().indexOf(groupName) === -1 && xsdGroupName) {
        _.each(subCategoriesMetadata, function (subCategoryMetaData, subCategoryName) {
          addCategoryAttributesDefinition({
            memberXml: memberXml,
            isMultiSelect: isMultiSelect,
            attributeDataDefinitions: attributeDataDefinitions,
            attributeId: attributeId,
            groupName: groupName,
            categoryMetaData: subCategoryMetaData,
            commonAttributes: commonAttributes,
            requirementLevel: requirementLevel
          })
        })
      }
    }
  } catch (error) {
    logger.info(error)
  }
}
WalmartMetaData.prototype.parseAndGenerateCategoryMetaData = function (categoryId, categoryName) {
  var that = this
  var categoryMetaData = {
    categoryRelationshipData: {
      id: categoryId,
      name: categoryName,
      children: [],
      isLeafNode: true
    },
    generatesMetaData: initializeNewCategory(categoryId, categoryName)
  }
  var workbook = new (that.getExcelParser()).Workbook()
  var subCategories = []
  var dataDefintionsAttributeMap = null
  var subCategoriesMetaData = {}
  var commonAttribute = {
    simpleTypeAddMores: [],
    complexTypeAddMores: [],
    AttributeCollection: {},
    categoryRef: categoryMetaData.generatesMetaData
  }
  var subCategoryId = null
  var parsedWorkBook = xlsxParser.parseFileByFolderPath(getExcelFolderPath(this.marketPlaceDomain), that.getCategoryFileName())
  workbook.xlsx.readFile(getExcelFolderPath(this.marketPlaceDomain) + that.getCategoryFileName()).then(function (data) {
    data.eachSheet(function (worksheet, sheetId) {
      var sheetName = worksheet.name
      var isNewSubCategory = (that.getMetaDataSheetNames().indexOf(sheetName) === -1 && sheetName[sheetName.length - 1] !== '~' && subCategories.indexOf(sheetName) === -1)
      if (isNewSubCategory) {
        subCategories.push(sheetName)
        subCategoriesMetaData[sheetName] = {
          simpleTypeAddMores: [],
          complexTypeAddMores: [],
          AttributeCollection: {}
        }
        subCategoryId = that.getSubCategorySheetMetaData(worksheet, subCategoriesMetaData[sheetName], commonAttribute)
        categoryMetaData.categoryRelationshipData.children.push({
          id: subCategoryId,
          name: sheetName,
          isLeafNode: true
        })
        subCategoriesMetaData[sheetName].categoryRef = initializeNewCategory(subCategoryId, sheetName)
        categoryMetaData.generatesMetaData.getChildren().push(subCategoriesMetaData[sheetName].categoryRef)
      }
      if (sheetName === DATA_DEFINITIONS_SHEET) {
        dataDefintionsAttributeMap = that.getDataDefinitionsofAllAttributes(parsedWorkBook)
        if (!dataDefintionsAttributeMap || _.isEmpty(dataDefintionsAttributeMap)) {
          throw new Error('Data definition not generated. Category ID ' + categoryId)
        }
      }
    })
    that.parseAttributesWithHiddenSheet(parsedWorkBook, dataDefintionsAttributeMap, subCategoriesMetaData, categoryMetaData, commonAttribute)
    if (subCategories.length > 0) {
      categoryMetaData.categoryRelationshipData.isLeafNode = false
      categoryMetaData.generatesMetaData.setLeafNode(false)
    }
    fs.writeFileSync(getMetaDataFolderPath(that.marketPlaceDomain) + categoryId + '.json', JSON.stringify(categoryMetaData))
  })
}
WalmartMetaData.prototype.fetchAndCreateAllCategoriesMetaData = function (callback) {
  var categoriesMetaData = {
    categoryRelationshipData: []
  }
  var categoryJson = null
  var folderPath = getMetaDataFolderPath(this.marketPlaceDomain)
  try {
    fs.readdir(folderPath, function (err, fileNames) {
      if (err) return callback(err)
      fileNames.forEach(function (fileName) {
        if (fileName.indexOf('.json') > -1 && fileName.indexOf('categoriesMetaData') === -1) {
          categoryJson = installerHelperUtil.loadJSON(folderPath + fileName.substring(0, fileName.indexOf('.json')))
          if (categoryJson && categoryJson.categoryRelationshipData) {
            if (categoryJson.categoryRelationshipData.children && !_.isEmpty(categoryJson.categoryRelationshipData.children)) {
              categoryJson.categoryRelationshipData.children = _.sortBy(categoryJson.categoryRelationshipData.children, function (v, k) {
                return v.name
              })
            }
            categoriesMetaData.categoryRelationshipData.push(categoryJson.categoryRelationshipData)
          }
        }
      })
      fs.writeFileSync(folderPath + 'categoriesMetaData.json', JSON.stringify(categoriesMetaData))
      return callback()
    })
  } catch (ex) {
    logger.info('Walmart | fetchAndCreateAllCategoriesMetaData, Exception Code: ' + ex.name + ', Message: ' + ex.message +
      ', stack: ' + ex.stack)
    return callback(new Error('Error while fetching and creating categories meta data.'))
  }
}
var initializeNewCategory = function (categoryId, categoryName) {
  return new Category({
    id: categoryId,
    name: categoryName,
    variation_attributes: [],
    fields: [],
    children: []
  })
}
var initializeNewAttribute = function (params) {
  return new Attribute({
    id: params.id,
    name: params.name,
    description: params.description, // + '\nExample: ' + row[dataDefinitionHeaders.Example_Values],
    filterType: FILTER_TYPE_MAP[params.filterType] ? FILTER_TYPE_MAP[params.filterType] : 'optional',
    type: params.options ? 'select' : 'input',
    options: params.options ? params.options.split(';').map(function (value) {
      return {
        id: value.trim(),
        text: value.trim()
      }
    }) : []
  })
}
var addCategoryAttributesDefinition = function (params) {
  var memberXml = params.memberXml
  var isMultiSelect = params.isMultiSelect
  var attributeDataDefinitions = params.attributeDataDefinitions
  var attributeId = params.attributeId
  var groupName = params.groupName
  var itemVariant = params.itemVariant
  var categoryMetaData = params.categoryMetaData
  var commonAttributes = params.commonAttributes
  var requirementLevel = params.requirementLevel
  var attributeDefinition
  var relatedAttributes
  var commonSubGroups = params.commonSubGroups || []
  var isCommonAttribute = null
  if (!memberXml && !isMultiSelect) { // simple non-repeating attribute
    attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, attributeId, groupName)
    if (attributeDefinition) {
      attributeDefinition.filterType = requirementLevel
      isCommonAttribute = existsInCommonAttributes(commonAttributes, attributeDefinition.id)
      if (!isCommonAttribute && commonSubGroups.indexOf(groupName) > -1) {
        logger.info('NEW COMMON ATTRIBUTE FOUND | Found attribute:', attributeDefinition.id, ' in common group name: ', groupName, '. Please check if Common Attributes need to be updated.')
      }
      if (itemVariant || !isCommonAttribute) {
        categoryMetaData.categoryRef.getAttributes().push(attributeDefinition)
      }
    }
  } else if (memberXml && !isMultiSelect) { // 1. faulty template, simple-non-repeating attribute but written incorrectly, OR 2. non repeating complex attribute eg.ageRange
    // find the attributes, which are related to this complex type. ageRange.RangeMaximum , ageRang.RangeMinimum , ageRange.unit
    relatedAttributes = []
    // 1. faulty template, simple-non-repeating attribute but written incorrectly, eg. medicineStrength/nationalDrugCode in Health&Beauty. Has memberXML for simpleattribute
    if(categoryMetaData.AttributeCollection[groupName][attributeId]) {
      attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, attributeId, groupName)
      logger.info('FOUND SIMPLE ATTRIBUTE DEFINITION AS COMPLEX ATTRIBUTE | Found attribute:', attributeDefinition.id, ' in group : ', groupName, ' with a Member XML, please validate the attribute in XSD as well.')
      if (attributeDefinition) {
        attributeDefinition.filterType = requirementLevel
        categoryMetaData.categoryRef.getAttributes().push(attributeDefinition)
      }
      return
    }
    // 2. non repeating complex attribute eg.ageRange
    _.each(categoryMetaData.AttributeCollection[groupName], function (attributeData, attributeKey) {
      if (attributeKey.indexOf(attributeId + '.') === 0) {
        relatedAttributes.push(attributeData)
      }
    })
    _.each(relatedAttributes, function (attributeData) {
      attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, attributeData.id.split('.')[1], groupName, attributeData.id.split('.')[0]) 
      if (attributeDefinition) {
        attributeDefinition.filterType = requirementLevel
        attributeDefinition.id = attributeData.id
        attributeDefinition.name = attributeData.name
        isCommonAttribute = existsInCommonAttributes(commonAttributes, attributeDefinition.id)
        if (!isCommonAttribute && commonSubGroups.indexOf(groupName) > -1) {
          logger.info('NEW COMMON ATTRIBUTE FOUND | Found attribute:', attributeDefinition.id, ' in common group name: ', groupName, '. Please check if Common Attributes need to be updated.')
        }
        if (itemVariant || !isCommonAttribute) {
          categoryMetaData.categoryRef.getAttributes().push(attributeDefinition)
        }
      }
    })
  } else if (memberXml && isMultiSelect) { // repeating simple or complex type
    if (categoryMetaData.simpleTypeAddMores.indexOf(attributeId) >= 0) {
      // attribute is a simple repeating type attribute eg. keyfeatures
      attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, attributeId, groupName)
      isCommonAttribute = existsInCommonAttributes(commonAttributes, memberXml + '.1')
      if (!isCommonAttribute && commonSubGroups.indexOf(groupName) > -1) {
        logger.info('NEW COMMON ATTRIBUTE FOUND | Found attribute:', attributeDefinition.id, ' in common group name: ', groupName, '. Please check if Common Attributes need to be updated.')
      }
      attributeDefinition.filterType = requirementLevel
      if (itemVariant || !isCommonAttribute) {
        for (var i = 0; i < REPEAT_COUNT; i++) {
          var cloneAttributeDefinition = _.cloneDeep(attributeDefinition)
          cloneAttributeDefinition.id = memberXml + '.' + (i + 1)
          cloneAttributeDefinition.name = cloneAttributeDefinition.name + ' ' + (i + 1)
          categoryMetaData.categoryRef.getAttributes().push(cloneAttributeDefinition)
        }
      }
    } else { // repeating complex type attribute
      relatedAttributes = []
      _.each(categoryMetaData.AttributeCollection[groupName], function (attributeData, attributeKey) {
        if (attributeKey.indexOf(attributeId + '.') === 0) {
          relatedAttributes.push(attributeData)
        }
      })
      if (!relatedAttributes.length) return false
      for (i = 0; i < REPEAT_COUNT; i++) {
        _.each(relatedAttributes, function (attributeData) {
          var id = attributeData.id.split('.')[1]
          var attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, id, groupName, attributeData.id.split('.')[0])
          if (attributeDefinition) {
            attributeDefinition.filterType = requirementLevel
            attributeDefinition.id = (attributeData.id)
            attributeDefinition.name = (attributeData.Name)
            var cloneAttributeDefinition = _.cloneDeep(attributeDefinition)
            cloneAttributeDefinition.id = attributeData.id.replace(attributeId + '.', memberXml + '.' + (i + 1) + '.')
            cloneAttributeDefinition.name = attributeData.name + ' ' + (i + 1)
            if (cloneAttributeDefinition) {
              if (itemVariant || !existsInCommonAttributes(commonAttributes, cloneAttributeDefinition.id)) {
                categoryMetaData.categoryRef.getAttributes().push(cloneAttributeDefinition)
              }
            }
          }
        })
      }
    }
  }
}
var getMetaDataFolderPath = function (marketPlaceDomain) {
  return WALMART_CONSTANTS.TEMPLATES_FOLDERPATH + marketPlaceDomain.toLowerCase() + '/' + WALMART_CONSTANTS.TEMPLATES_JSON_FOLDERNAME + '/'
}
var getExcelFolderPath = function (marketPlaceDomain) {
  return WALMART_CONSTANTS.TEMPLATES_FOLDERPATH + marketPlaceDomain.toLowerCase() + '/' + WALMART_CONSTANTS.TEMPLATES_EXCEL_FOLDERNAME + '/'
}
var getHandlebarFolderPath = function (marketPlaceDomain) {
  return path.resolve(__dirname, '../', WALMART_CONSTANTS.TEMPLATES_FOLDERPATH + marketPlaceDomain.toLowerCase() + '/' + WALMART_CONSTANTS.TEMPLATES_HANDLEBAR_FOLDERNAME + '/')
}
/**
 * Fetch data-definition of attrbiute from DataDefinitions of the metadata.
 * If attribute is not found in the given group, all the groups are search
 * If attribute is not found at all, it's parent attribute is returned
 * @param {*} attributeDataDefinitions
 * @param {*} attributeId
 * @param {*} groupName
 * @param {*} parentAttributeId
 */
var getAttributeDefinitionFromId = function (attributeDataDefinitions, attributeId, groupName, parentAttributeId) {
  var attributeDefinition = attributeDataDefinitions && attributeDataDefinitions[groupName] &&  attributeDataDefinitions[groupName][attributeId]
  if (!attributeDefinition) {
    attributeDefinition = _.find(attributeDataDefinitions, function (dataDefinitions, groupName) {
      if (dataDefinitions[attributeId]) {
        return dataDefinitions[attributeId]
      }
    })
    if (attributeDefinition) attributeDefinition = attributeDefinition[attributeId]
  }
  if (!attributeDefinition && parentAttributeId) {
    attributeDefinition = getAttributeDefinitionFromId(attributeDataDefinitions, parentAttributeId, groupName, null)
  }
  if (!attributeDefinition) {
    logger.info('ALERT Not found ID ' + attributeId)
  }
  if (attributeDefinition) attributeDefinition = _.cloneDeep(attributeDefinition)
  return attributeDefinition
}
/**
 * Check whether an attribute id is present in commonAttribute fields or it's children fields
 * @param {JSON} commonAttributes
 * @param {string} id
 */
var existsInCommonAttributes = function (commonAttributes, id) {
  var found = _.find(commonAttributes.fields, function (attribute) {
    return attribute.id === id
  })
  if (!found) {
    found = _.find(commonAttributes.children, function (childCommonAttributes) {
      return _.find(childCommonAttributes.fields, function (attribute) {
        return attribute.id === id
      })
    })
  }
  return !!found
}
module.exports = WalmartMetaData
