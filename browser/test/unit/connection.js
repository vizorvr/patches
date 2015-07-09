var assert = require('assert');

global.E2 = {
	uid: function() {},
	dt: {
		ANY: 0
	},
	slot_type: {
		input: 0,
		output: 1
	}
}

global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node')
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
		
		na.add_slot(1, {  })
		nb.add_slot(0, {  })

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
		
		na.add_slot(1, {  })
		nb.add_slot(0, {  })

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
		
		na.add_slot(1, {  })
		nb.add_slot(0, {  })

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



