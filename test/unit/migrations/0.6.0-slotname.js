var fs = require('fs')
var assert = require('assert')

var migrateGraphToUseSlotNames = require(__dirname+'/../../../tools/migration/0.6.0/migrate')
	.migrateGraphToUseSlotNames

var fixture = fs.readFileSync(__dirname+'/../../fixtures/slider-float.json')

var parsePluginSlots = require('../../../lib/parsePluginSlots')

describe('parsePluginSlots', function() {
	it('finds slots', function() {
		var slots = parsePluginSlots()
		assert.equal(slots['sine_modulator.0'][0], 'time')
		assert.equal(slots['runtime_event_write.0'][2], 'data')
	})
})

describe('Minimal graph migration to use slot UIDs', function() {
	var graph = {
		nodes: [
			{ uid: 'nuid-a', plugin: 'pluginId-a' },
			{ uid: 'nuid-b', plugin: 'pluginId-b' },
		],
		conns: [{
			src_nuid: 'nuid-a',
			dst_nuid: 'nuid-b',
			src_slot: 0,
			dst_slot: 0
		}]
	}

	var slotMap = {
		'pluginId-a.1': [ 'slot-a' ], // output
		'pluginId-b.0': [ 'slot-b' ] // input
	}

	it('changes connection slot uid`s', function() {
		var result = migrateGraphToUseSlotNames(slotMap, graph)
		assert.equal(result.conns[0].src_slot, 'slot-a')
		assert.equal(result.conns[0].dst_slot, 'slot-b')
	})
})

describe('Nested graph migration to use slot UIDs', function() {
	var graph = JSON.parse(fixture)
	var root = graph.root
	var nested = root.nodes[2].graph

	var slotMap = parsePluginSlots()

	slotMap['float_display.0'] = [ 'float output' ]
	slotMap['slider_float_generator.1'] = [ 'slider output' ] 

	it('maps connection slot uid`s', function() {
		migrateGraphToUseSlotNames(slotMap, graph.root)
		assert.equal(nested.conns[0].src_slot, 0) // dyn slot
		assert.equal(nested.conns[0].dst_slot, 'float output')
		assert.equal(root.conns[0].src_slot, 'slider output')
	})
})
