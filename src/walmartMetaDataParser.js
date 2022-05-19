var WalmartMetadata = require('./walmartMetaData')
var Excel = require('exceljs') //Including this library as we already moved to nodeV10.
var logger = require('winston')

var sportsWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'SportAndRecreation.xlsm',
  'excelParser': Excel
})
sportsWalmartMetadata.parseAndGenerateCategoryMetaData('SportAndRecreation', 'Sport and Recreation')

var clothingWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Clothing.xlsm',
  'excelParser': Excel
})
clothingWalmartMetadata.parseAndGenerateCategoryMetaData('ClothingCategory', 'Clothing Category')

var toysWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Toys.xlsm',
  'excelParser': Excel
})
toysWalmartMetadata.parseAndGenerateCategoryMetaData('ToysCategory', 'Toys Category')

var footwearWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Footwear.xlsm',
  'excelParser': Excel
})
footwearWalmartMetadata.parseAndGenerateCategoryMetaData('FootwearCategory', 'Footwear Category')

var jewelryWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Jewelry.xlsm',
  'excelParser': Excel
})
jewelryWalmartMetadata.parseAndGenerateCategoryMetaData('JewelryCategory', 'Jewelry Category')

var animalWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Animal.xlsm',
  'excelParser': Excel
})
animalWalmartMetadata.parseAndGenerateCategoryMetaData('Animal', 'Animal')

var electronicsWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Electronics.xlsm',
  'excelParser': Excel
})
electronicsWalmartMetadata.parseAndGenerateCategoryMetaData('Electronics', 'Electronics')

var vehicleWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Vehicle.xlsm',
  'excelParser': Excel
})
vehicleWalmartMetadata.parseAndGenerateCategoryMetaData('Vehicle', 'Vehicle')

var homeWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Home.xlsm',
  'excelParser': Excel
})
homeWalmartMetadata.parseAndGenerateCategoryMetaData('Home', 'Home')

var gardenAndPatioWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'GardenAndPatio.xlsm',
  'excelParser': Excel
})
gardenAndPatioWalmartMetadata.parseAndGenerateCategoryMetaData('GardenAndPatioCategory', 'Garden And Patio Category')

var healthAndBeautyWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'HealthAndBeauty.xlsm',
  'excelParser': Excel
})
healthAndBeautyWalmartMetadata.parseAndGenerateCategoryMetaData('HealthAndBeauty', 'Health And Beauty')

var mediaWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Media.xlsm',
  'excelParser': Excel
})
mediaWalmartMetadata.parseAndGenerateCategoryMetaData('Media', 'Media')

var toolsAndHardwareWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'ToolsAndHardware.xlsm',
  'excelParser': Excel
})
toolsAndHardwareWalmartMetadata.parseAndGenerateCategoryMetaData('ToolsAndHardware', 'Tools And Hardware')

//TODO: WLMTNS-216 - Remove this once all the customers removed this category from UI
var artAndCraftMetadataOld = new WalmartMetadata({
  'categoryFileName': 'ArtAndCraft.xlsm',
  'excelParser': Excel
})
artAndCraftMetadataOld.parseAndGenerateCategoryMetaData('ArtAndCraft', 'Art And Craft[Use Art And Craft Category]')

var artAndCraftMetadata = new WalmartMetadata({
  'categoryFileName': 'ArtAndCraft.xlsm',
  'excelParser': Excel
})
artAndCraftMetadata.parseAndGenerateCategoryMetaData('ArtAndCraftCategory', 'Art And Craft Category')

//WLMTNS-252
var carriersAndAccessoriesWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'CarriersAndAccessories.xlsm',
  'excelParser': Excel
})
carriersAndAccessoriesWalmartMetadata.parseAndGenerateCategoryMetaData('CarriersAndAccessoriesCategory', 'Carriers And Accessories Category')

var occasionAndSeasonalWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'OccasionAndSeasonal.xlsm',
  'excelParser': Excel
})
occasionAndSeasonalWalmartMetadata.parseAndGenerateCategoryMetaData('OccasionAndSeasonal', 'Occasion And Seasonal')

var babyWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Baby.xlsm',
  'excelParser': Excel
})
babyWalmartMetadata.parseAndGenerateCategoryMetaData('Baby', 'Baby')

//WLMTNS-272
var officeWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Office.xlsm',
  'excelParser': Excel
})
officeWalmartMetadata.parseAndGenerateCategoryMetaData('OfficeCategory', 'Office Category')

var photographyWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'Photography.xlsm',
  'excelParser': Excel
})
photographyWalmartMetadata.parseAndGenerateCategoryMetaData('Photography', 'Photography')

//WLMTNS-305
var musicalInstrumentWalmartMetadata = new WalmartMetadata({
  'categoryFileName': 'MusicalInstrument.xlsm',
  'excelParser': Excel
})
musicalInstrumentWalmartMetadata.parseAndGenerateCategoryMetaData('MusicalInstrument', 'Musical Instrument')

var metaData = new WalmartMetadata()
metaData.fetchAndCreateAllCategoriesMetaData(function (err) {
  if (err) {
    logger.info('fetchAndCreateAllCategoriesMetaData | Error while creating all categories meta data file: ' + err)
  }
  logger.info('Completed aggregating meta data of all the US categories.')
})


