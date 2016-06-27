var assert = require('assert')

var slot = require('./helpers').slot
var reset = require('./helpers').reset
var loadPlugin = require('./helpers').loadPlugin

describe('array_function', function() {
	var plugin, core

	beforeEach(function() {
		core = reset()
		loadPlugin('array_function')
		plugin = new E2.plugins.array_function(core)
		plugin.graph = {
			copies: [],
			reset: function() {},
			update: function() {},
			clearCopies: function() {},
			makeCopy: function(i) {
				i = i || this.copies.length
				this.copies[i] = this
				return this
			},
			variables: {
				read: function() {},
				write: function() {},
				set_datatype: function() {}
			}
		}
	})

	it('uses length input', function() {
		plugin.update_input({ name: 'length' }, 3.34)
		assert.equal(plugin.length, 3)
	})

	it('calls graph update', function() {
		var updates = 0
		plugin.update_input({ name: 'length' }, 3)
		plugin.graph.update = function() { updates++ }
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		assert.equal(updates, 3)
	})

	it('creates copies of graph', function() {
		plugin.update_input({ name: 'length' }, 3)
		assert.equal(plugin.graph.copies.length, 3)
	})

	it('sets loop index', function(done) {
		plugin.graph.variables.write = function(k, v) {
			assert.equal('index', k)
			assert.equal(1, v)
			done()
		}
		plugin.update_input({ name: 'length' }, 1)
		plugin.update_state({abs_t:0, delta_t:(1/60)})
	})

	it('uses loop output', function() {
		plugin.update_input({ name: 'length' }, 1)
		plugin.graph.variables.read = function() {
			return 'foo'
		}
		plugin.update_state({abs_t:0, delta_t:(1/60)})
		assert.equal(plugin.array[0], 'foo')
	})

	it('sets dt on item variable change', function() {
		plugin.output_slots = [ {} ]
		plugin.variable_dt_changed('foo')
		assert.equal(plugin.output_slots[0].dt, 'foo')
	})

})

