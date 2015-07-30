var assert = require('assert');

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

global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node').Node
global.Connection = require('../../scripts/connection').Connection
global.msg = console.log

describe('Connection', function() {
	before(function() {
	})

	it('calls node addOutput', function(done) {
		var na = new Node()
		na.uid = 'na'
		var nb = new Node()
		nb.uid = 'nb'
		
		na.add_slot(1, { dt: E2.dt.FLOAT, name: 'x' })
		nb.add_slot(0, { dt: E2.dt.FLOAT, name: 'x' })

		na.addOutput = function() { done() }

		Connection.hydrate({ nodes: [ na, nb ] }, {
			src_nuid: 'na',
			dst_nuid: 'nb',
			src_slot: 0,
			src_dyn: true,
			dst_slot: 0,
			dst_dyn: true
		})
	})

	it('calls node addInput', function(done) {
		var na = new Node()
		na.uid = 'na'
		var nb = new Node()
		nb.uid = 'nb'
		
		na.add_slot(1, { dt: E2.dt.FLOAT, name: 'x' })
		nb.add_slot(0, { dt: E2.dt.FLOAT, name: 'x' })

		nb.addInput = function() { done() }

		Connection.hydrate({ nodes: [ na, nb ] }, {
			src_nuid: 'na',
			dst_nuid: 'nb',
			src_slot: 0,
			src_dyn: true,
			dst_slot: 0,
			dst_dyn: true
		})
	})


	it('patches up only once', function(done) {
		var na = new Node()
		na.uid = 'na'
		var nb = new Node()
		nb.uid = 'nb'
		
		na.add_slot(1, {dt: E2.dt.FLOAT, name: 'x'})
		nb.add_slot(0, {dt: E2.dt.FLOAT, name: 'x'})

		na.addOutput = function() { done() }

		var conn = Connection.hydrate({ nodes: [ na, nb ] }, {
			src_nuid: 'na',
			dst_nuid: 'nb',
			src_slot: 0,
			src_dyn: true,
			dst_slot: 0,
			dst_dyn: true
		})

		conn.patch_up()
		conn.patch_up()
		conn.patch_up()
	})
})



