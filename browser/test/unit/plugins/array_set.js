var assert = require('assert')

global.EventEmitter = require('events').EventEmitter
global.LinkedSlotGroup = require('../../../scripts/node').LinkedSlotGroup

var slot = require('./helpers').slot
var reset = require('./helpers').reset
var loadPlugin = require('./helpers').loadPlugin

describe('array_set', function() {
	var plugin, core

	beforeEach(function() {
		core = reset()
		node = new EventEmitter()
		loadPlugin('array_set')
		plugin = new E2.plugins.array_set(core, node)
	})

	it('declares the right slots', function() {
		assert.ok(plugin.input_slots.length, 3)
		assert.ok(plugin.output_slots.length, 1)
	})

	it('composes new arrays', function() {
		plugin.update_input(slot(1), 0)
		plugin.update_input(slot(2), 'bar')

		assert.deepEqual(plugin.update_output(), [ 'bar' ])
	})

	it('calls LSG on connection change', function(done) {
		plugin.lsg.connection_changed = function() {
			done()
		}
		plugin.connection_changed()
	})

	it('adds to existing array', function() {
		plugin.update_input(slot(0), [ 'foo' ])
		plugin.update_input(slot(1), 1)
		plugin.update_input(slot(2), 'bar')

		assert.deepEqual(plugin.update_output(), ['foo','bar'])
	})

	it('adds to existing array 2', function() {
		plugin.update_input(slot(0), [ 'foo' ])
		plugin.update_input(slot(1), 1)
		plugin.update_input(slot(2), 'bar')

		plugin.update_input(slot(0), plugin.update_output().slice())
		plugin.update_input(slot(1), 2)
		plugin.update_input(slot(2), 'baz')

		assert.deepEqual(plugin.update_output(), ['foo','bar','baz'])
	})

})

