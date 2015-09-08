var assert = require('assert')

var slot = require('./helpers').slot
var reset = require('./helpers').reset
var loadPlugin = require('./helpers').loadPlugin
global.EventEmitter = require('../../../scripts/event-emitter')
global.Node = require('../../../scripts/node').Node
global.LinkedSlotGroup = require('../../../scripts/node').LinkedSlotGroup

global.self = {}

global.THREE = require('./../../../vendor/three/three.js')

describe('material_modifier', function()
{
	var node, plugin, core

	beforeEach(function()
	{
		core = reset()

		loadPlugin('three_material_modifier')

		var ag = E2.core.active_graph
		node = new Node(ag, undefined, 0, 0)
		plugin = new E2.plugins.three_material_modifier(core, node)
		node.set_plugin(plugin)
		plugin.reset()
	})

	it('pass material through without overriding', function() {
		var m = [new THREE.Material()]
		m[0].name = 'm1'
		plugin.update_input({index: 0}, m)

		plugin.update_state()

		var o = plugin.update_output({index: 0})

		assert.deepEqual(o, m)
	})

	it('overrides default material', function() {
		var m1 = [new THREE.Material()]
		m1[0].name = 'default material'

		var m2 = [new THREE.Material()]
		m2[0].name = 'override material'

		plugin.update_input({index: 0, name: 'material array'}, m1)
		plugin.update_input({index: 0, uid: 0x1234, name: 'default material'}, m2[0])

		plugin.update_state()

		var o = plugin.update_output({index: 0})

		assert.deepEqual(o, m2)
	})

	it('overrides one of many materials', function() {
		var m1 = [
			new THREE.Material(),
			new THREE.Material(),
			new THREE.Material(),
			new THREE.Material(),
			new THREE.Material()]

		m1[0].name = 'mat0'
		m1[1].name = 'mat1'
		m1[2].name = 'mat2'
		m1[3].name = 'mat3'
		m1[4].name = 'mat4'

		var m2 = [new THREE.Material()]
		m2[0].name = 'override material'

		plugin.update_input({index: 0, name: 'material array'}, m1)
		plugin.update_input({index: 3, uid: 0x1234, name: 'mat3'}, m2[0])

		plugin.update_state()

		var o = plugin.update_output({index: 0})

		assert.deepEqual(o, [m1[0], m1[1], m1[2], m2[0], m1[4]])
	})

})
