var assert = require('assert')

global.EventEmitter = require('events').EventEmitter
global.LinkedSlotGroup = require('../../../scripts/node').LinkedSlotGroup

var slot = require('./helpers').slot
var reset = require('./helpers').reset
var loadPlugin = require('./helpers').loadPlugin

describe('array_remove', function() {
	var plugin, core

	beforeEach(function() {
		core = reset()
		node = new EventEmitter()
		loadPlugin('array_remove')
		plugin = new E2.plugins.array_remove(core, node)
	})

	it('deletes the right item', function() {
		plugin.update_input(slot(0), ['a','b','c','d'])
		plugin.update_input(slot(1), 2)
		assert.deepEqual(plugin.update_output(), ['a','b','d'])
	})

})

