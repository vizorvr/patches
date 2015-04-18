var assert = require('assert')

global.Handlebars = {}
var CollapsibleSelectControl = require(__dirname+'/../../scripts/collapsible-select-control.js')

describe('scoring',function(){
	var c = new CollapsibleSelectControl()

	it('debf in `Emitters debug float`', function() {
		assert.equal(c.scoreResult('debf', 'Emitters/Debug/Float'), 16)
	})

	it('debugf in `Emitters debug float`', function() {
		assert.equal(c.scoreResult('debugf', 'Emitters/Debug/Float'), 100)
	})

	it('template in `foo template bar`', function() {
		assert.equal(c.scoreResult('template', 'foo template bar'), 100)
	})
})

describe('filtering',function(){
	var c 
	beforeEach(function() {
		c = new CollapsibleSelectControl()
		c.data([
			{ category: 'Plugins', path:'float-path', title: 'Emitters/Debug/Float'},
			{ category: 'Something', path:'other-path', title: 'Else/Entirely'}
		])
	})

	it('builds titles', function() {
		assert.deepEqual(c._data, {
			Plugins: {
				'Emitters/Debug/Float': {
					category: 'Plugins',
					title: 'Emitters/Debug/Float',
					path: 'float-path'
				}
			},
			Something: {
				'Else/Entirely': {
					path: 'other-path',
					category: 'Something',
					title: 'Else/Entirely'
				}
			}
		})
	})

	it('finds debgf', function() {
		var f = c._filterData('debgf')
		assert.deepEqual(f, [{
			score: 21, title: 'Emitters/Debug/Float', path: 'float-path',
			category: 'Plugins'
		}])
	})
})
