var assert = require('assert');
var browserPath = __dirname+'/../../';
global.Plugin = require(browserPath+'scripts/plugin.js')

global.E2 = {
	uid: function() {},
	dt: {
		ANY: { id: 8, name: 'Arbitrary' },
		FLOAT: { id: 0, name: 'Float' }
	},
	slot_type: {
		input: 0,
		output: 1
	}
}

global.msg = console.error

global.EventEmitter = require('../../scripts/event-emitter')
global.SubGraphPlugin = require('../../scripts/subGraphPlugin')

describe('SubGraphPlugin', function() {
	var sub, proxyNode, internalSlot
	var conn = {
		src_slot: {
			dt: 'datatype',
			array: true
		},
		dst_slot: {
			dt: 'datatype',
			array: true
		}
	}

	beforeEach(function() {
		internalSlot = { dt: E2.dt.ANY }
		proxyNode = {
			dyn_outputs: [ internalSlot ],
			outputs: [],
			plugin: {},
			reset: function() {}
		}
		sub = new SubGraphPlugin()
		sub.parent_node = {}
		sub.core = {
			datatypes: E2.dt,
			get_default_value: function() { return 'testDefaultValue' }
		}
	})

	it('changes datatype when inbound connection lost', function() {
		proxyNode.dyn_outputs = [ internalSlot ]
		sub.input_nodes = { 'eSlotUid': proxyNode }
		var externalSlot = { uid: 'eSlotUid', type: 0 }
		sub.connection_changed(false, conn, externalSlot)
		assert.equal(externalSlot.dt.id, 8)
		assert.equal(internalSlot.dt.id, 8)
	})

	it('resets plugin when inbound connection lost', function(done) {
		proxyNode.dyn_outputs = [ internalSlot ]
		sub.input_nodes = { 'eSlotUid': proxyNode }
		var externalSlot = { uid: 'eSlotUid', type: 0 }
		proxyNode.reset = done
		sub.connection_changed(false, conn, externalSlot)
	})

	it('changes datatype and arrayness when inbound connection created', function() {
		proxyNode.dyn_outputs = [ internalSlot ]
		sub.input_nodes = { 'eSlotUid': proxyNode }
		var externalSlot = { uid: 'eSlotUid', type: 0, dt: E2.dt.ANY }
		sub.connection_changed(true, conn, externalSlot)
		assert.equal(externalSlot.dt, 'datatype')
		assert.equal(externalSlot.array, true)
		assert.equal(internalSlot.dt, 'datatype')
		assert.equal(internalSlot.array, true)
	})

	it('changes datatype and arrayness when outbound connection created', function() {
		proxyNode.dyn_inputs = [ internalSlot ]
		sub.output_nodes = { 'eSlotUid': proxyNode }
		var externalSlot = { uid: 'eSlotUid', type: 1, dt: E2.dt.ANY }
		sub.connection_changed(true, conn, externalSlot)
		assert.equal(externalSlot.dt, 'datatype')
		assert.equal(externalSlot.array, true)
		assert.equal(internalSlot.dt, 'datatype')
		assert.equal(internalSlot.array, true)
	})

	it('resets plugin data when outbound connection created', function() {
		proxyNode.dyn_inputs = [ internalSlot ]
		sub.output_nodes = { 'eSlotUid': proxyNode }
		var externalSlot = { uid: 'eSlotUid', type: 1, dt: E2.dt.ANY }
		sub.connection_changed(true, conn, externalSlot)
		assert.equal(proxyNode.plugin.data, 'testDefaultValue')
	})

})



