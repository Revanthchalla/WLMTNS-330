'use strict'
var assert = require('assert')
var fs = require('fs')
var handleBars = require('handlebars')

function compileClothing(option, cb) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Clothing.hbs')).toString()
        obj = obj.replace('{{#compare [Category Id] "===" "Clothing"}}', '')
        obj = obj.replace('{{/compare}}', '')
        obj = obj.replace(/>[\n\r\t ]+</g, '><')
        obj = obj.replace(/}}[\n\r\t ]+</g, '}}<')
        obj = obj.replace(/>[\n\r\t ]+{{/g, '>{{')
        obj = obj.replace(/}}[\n\r\t ]+{{/g, '}}{{')
        var template = handleBars.compile(obj)
        var jsonObj = JSON.parse(fs.readFileSync('./test/data/templates/sampleJsonData/ClothingSampleData.json').toString())
        var res = template(jsonObj)
        cb(null, res)
    }

    catch
        (ex) {
        return cb(ex, null)

    }
}
describe('Clothing *.hbs file', function () {
    it('Clothing file validation', function () {
        var option = {}
        var expectedResponse = (fs.readFileSync('./test/data/templates/expectedOutputData/expectedClothing.hbs')).toString()
        compileClothing(option, function (err, res) {
            if (err) {
                assert.ifError(err)
            }
            else {
                 assert.equal(expectedResponse.trim().replace(/\n|\r/g, ""), res.trim().replace(/\n|\r/g, ""))
            }
        })

    })
})

function compileCommon(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/common.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('common *.hbs file', function () {
    it('common file validation', function () {
        var option = {}
        compileCommon(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})


function compileCycling(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Cycling.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('Cycling *.hbs file', function () {
    it('Cycling file validation', function () {
        var option = {}
        compileCycling(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})

function compileFootwear(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Footwear.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('Footwear *.hbs file', function () {
    it('Footwear file validation', function () {
        var option = {}
        compileFootwear(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})

function compileJewelry(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Jewelry.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('Jewelry *.hbs file', function () {
    it('Jewelry file validation', function () {
        var option = {}
        compileJewelry(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})

function compileOptics(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Optics.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('Optics *.hbs file', function () {
    it('Optics file validation', function () {
        var option = {}
        compileOptics(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})

function compileSportAndRecreationOther(option, cb) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/SportAndRecreationOther.hbs')).toString()
        obj = obj.replace('{{#compare [Category Id] "===" "SportAndRecreationOther"}}', '')
        obj = obj.replace('{{/compare}}', '')
        obj = obj.replace(/>[\n\r\t ]+</g, '><')
        obj = obj.replace(/}}[\n\r\t ]+</g, '}}<')
        obj = obj.replace(/>[\n\r\t ]+{{/g, '>{{')
        obj = obj.replace(/}}[\n\r\t ]+{{/g, '}}{{')
        var template = handleBars.compile(obj)
        var jsonObj = JSON.parse(fs.readFileSync('./test/data/templates/sampleJsonData/SportAndRecreationSampleData.json').toString())
        var res = template(jsonObj)
        cb(null, res)
    }

    catch
        (ex) {
        return cb(ex, null)

    }
}
describe('Sports and Recreation *.hbs file', function () {
    it('Sports and Recreation file validation', function () {
        var option = {}
        var expectedResponse = (fs.readFileSync('./test/data/templates/expectedOutputData/expectedSportsAndRecreation.hbs')).toString()
        compileSportAndRecreationOther(option, function (err, res) {
            if (err) {
                assert.ifError(err)
            }
            else {
                 assert.equal(expectedResponse.trim().replace(/\n|\r/g, ""), res.trim().replace(/\n|\r/g, ""))
            }
        })

    })
})

function compileToys(option, cb) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Toys.hbs')).toString()
        obj = obj.replace('{{#compare [Category Id] "===" "Toys"}}', '')
        obj = obj.replace('{{/compare}}', '')
        obj = obj.replace(/>[\n\r\t ]+</g, '><')
        obj = obj.replace(/}}[\n\r\t ]+</g, '}}<')
        obj = obj.replace(/>[\n\r\t ]+{{/g, '>{{')
        obj = obj.replace(/}}[\n\r\t ]+{{/g, '}}{{')
        
        var template = handleBars.compile(obj)
        var jsonObj = JSON.parse(fs.readFileSync('./test/data/templates/sampleJsonData/ToysSampleData.json').toString())
        var res = template(jsonObj)
        cb(null, res)
    }

    catch
        (ex) {
        return cb(ex, null)

    }
}
describe('Toys *.hbs file', function () {
    it('Toys file validation', function () {
        var option = {}
        var expectedResponse = (fs.readFileSync('./test/data/templates/expectedOutputData/expectedToys.hbs')).toString()
        compileToys(option, function (err, res) {
            if (err) {
                assert.ifError(err)
            }
            else {
                assert.equal(expectedResponse.trim().replace(/\n|\r/g, ""), res.trim().replace(/\n|\r/g, ""))
            }
        })

    })
})

function compileWeapons(option, callback) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/Weapons.hbs')).toString()
        var template = handleBars.compile(obj)
        callback(null)
    }
    catch
        (ex) {
        return callback(ex)

    }
}
describe('Weapons *.hbs file', function () {
    it('Weapons file validation', function () {
        var option = {}
        compileWeapons(option, function (err) {
            if (err) {
                assert.ifError(err)
            }
        })

    })
})

function compileCommon(option, cb) {
    try {
        var obj = (fs.readFileSync('./templates/us/handlebar/common.hbs')).toString()
        obj = obj.replace('{{/compare}}', '')
        obj = obj.replace(/>[\n\r\t ]+</g, '><')
        obj = obj.replace(/}}[\n\r\t ]+</g, '}}<')
        obj = obj.replace(/>[\n\r\t ]+{{/g, '>{{')
        obj = obj.replace(/}}[\n\r\t ]+{{/g, '}}{{')
        var template = handleBars.compile(obj)
        var jsonObj = JSON.parse(fs.readFileSync('./test/data/templates/sampleJsonData/common.json').toString())
        var res = template(jsonObj)
        cb(null, res)
    }

    catch
        (ex) {
        return cb(ex, null)

    }
}
describe('common.hbs file', function () {
    it('common file validation', function () {
        var option = {}
        var expectedResponse = (fs.readFileSync('./test/data/templates/expectedOutputData/expectedCommon.hbs')).toString()
        compileCommon(option, function (err, res) {
            if (err) {
                assert.ifError(err)
            }
            else {
                 assert.equal(expectedResponse.trim().replace(/\n|\r/g, ""), res.trim().replace(/\n|\r/g, ""))
            }
        })

    })
})