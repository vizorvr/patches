var assert = require('assert');
var when = require('when')

global.VizorUI = require('../../scripts/ui/pageStore')
global.EventEmitter = require('events').EventEmitter
global.CustomEvent = function(name, opts) {
	this.name = name
	this.detail = opts.detail
}
global.document = new EventEmitter()
global.document.dispatchEvent = function(e) {
	this.emit.call(this, e.name, e)
}
global.uniq = new Date().getTime()


// note: refer to store limitations

describe('pageStore', function() {

	beforeEach(function() {
		document.removeAllListeners()
	})


	it('emits event when a property changes', function(done) {

		var emitted = false
		var testData = {
			key1: 'value1',
			key2: 'value2'
		}
		document.on('changed:test', function(e){
			assert.equal(e.detail.id, uniq, 'uniq matches')
			assert.equal(e.detail.key, 'key1', 'key matches')
			assert.equal(e.detail.value, 'changed!', 'value matches')
			emitted = true
		})
		var s = VizorUI.makeStore(testData, 'test', uniq)
		s.key1 = 'changed!'

		assert.equal(emitted, true, 'expected event emitted')
		done()
	})

	it('emits event when a deep property changes', function(done) {

		uniq++
		var emitted = false
		var testData = {
			key1: 'value1',
			key2: {
				'a': 4,
				'b': 5
			}
		}
		document.once('changed:test', function(e){
			assert.equal(e.detail.id, uniq, 'uniq matches')
			if (e.detail.key === 'key2.b') {
				assert.equal(e.detail.value, 6, 'value matches')
				emitted = true
			}
		})
		var s = VizorUI.makeStore(testData, 'test', uniq)
		++s.key2.b

		assert.equal(emitted, true, 'expected event emitted')
		done()

	})

	it('converts a new object property to sub-store', function(done) {
		uniq++
		var emits = false
		var testData = {
			key1: 'value1',
			key2: {
				'a': 4,
				'b': 5
			}
		}

		var s = VizorUI.makeStore(testData, 'test', uniq)
		s.key2 = {'c':1, 'd':2, 'e':3, f:{g:10, e:11}}
		assert.equal('c' in s.key2, true, 'new value set')

		document.once('changed:test', function(e){
			assert.equal(e.detail.id, uniq, 'uniq matches')
			assert.equal(e.detail.key, 'key2.f.g', 'key matches')
			assert.equal(e.detail.value, 11, 'new value is set')
			emits = true
		})

		++s.key2.f.g

		assert.equal(emits, true, 's.key2 continues to emit')
		done()
	})

	it('makes a pagestore from Vizor.pageObjects', function(done){
		uniq++
		global.Vizor = {
			pageObjects: {
				graphs: [],
				profiles: [],
				unknownFlatKey : 'string',
				unknownObj : {}
			}
		}
		var po = global.Vizor.pageObjects

		assert.equal(po.graphs.__store__, undefined, 'graphs.__store__ is undefined before making store')
		VizorUI.pageStore()

		assert.equal(po.graphs.__store__, true, '.graphs has been made a store')
		assert.equal(po.profiles.__store__, true, '.profiles has been made a store')
		assert.equal(po.unknownObj.__store__, true, '.unknownObj has been made a store')
		assert.equal(po.unknownFlatKey.__store__, undefined, 'unknownFlatKey is not turned into a substore')
		assert.equal(po.__store__, undefined, 'Vizor.pageObjects itself is not a .__store__')
		done();
	})


})
