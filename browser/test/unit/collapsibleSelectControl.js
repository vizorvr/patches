var assert = require('assert')
var fs = require('fs')

global.Handlebars = {}
global.E2 = {uid:function(){return Date.now()}}
var CollapsibleSelectControl = require(__dirname+'/../../scripts/collapsible-select-control.js')
var patchesJson = JSON.parse(fs.readFileSync(__dirname+'/../../patches/patches.json'))
var patches = Object.keys(patchesJson).reduce(function(arr, catName) {
	Object.keys(patchesJson[catName]).map(function(title) {
		arr.push({ category: catName, title: title, path: patchesJson[catName][title]})
	})
	return arr
}, [])

var pluginsJson = JSON.parse(fs.readFileSync(__dirname+'/../../plugins/plugins.json'))
var plugins = Object.keys(pluginsJson)
	.reduce(function(arr, catName) {
		Object.keys(pluginsJson[catName]).map(function(title) {
			arr.push({
				category: catName,
				title: catName + '/' 	+ title,
				path: pluginsJson[catName][title]
			})
		})
		return arr
	}, [])

patches = patches.concat(plugins)

describe('scoring',function(){
	var c = new CollapsibleSelectControl()

	it('debf in `Emitters debug float`', function() {
		assert.equal(c.scoreResult('debf', 'Emitters/Debug/Float'), 24)
	})

	it('debugf in `Emitters debug float`', function() {
		assert.equal(c.scoreResult('debugf', 'Emitters/Debug/Float'), 53)
	})

	it('template in `foo template bar`', function() {
		assert.equal(c.scoreResult('template', 'foo template bar'), 500)
	})

	it('oscillate in `gen oscillator bar`', function() {
		assert.equal(c.scoreResult('oscillate', 'gen oscillator bar'), 121)
	})
})

describe('filtering',function(){
	var c 
	beforeEach(function() {
		c = new CollapsibleSelectControl()
		c.data(patches.concat(plugins))
	})

	it('finds oscillators with `oscillate`', function() {
		var f = c._filterData('oscillate')
		assert.deepEqual(f[0].score, 1000)
		assert.deepEqual(f[0].title, 'Oscillate 2 values with in tween')
	})

	it('finds debgf', function() {
		var f = c._filterData('debgf')
		assert.deepEqual(f[0].title, 'DEBUG TOOLS/Data info')
	})

	it('finds floa', function() {
		var f = c._filterData('floadeb')
		assert.deepEqual(f[0].title, 'DEBUG TOOLS/Float')
	})
})
