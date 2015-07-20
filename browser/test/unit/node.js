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

global.msg = console.error

global.EventEmitter = require('../../scripts/event-emitter')
global.Node = require('../../scripts/node').Node

describe('Node', function() {
	var core, app

	it('adds input slots', function() {
		var node = new Node()
		node.add_slot(0, { a: 'a', dt: E2.dt.FLOAT })
		assert.equal(node.dyn_inputs.length, 1)
		assert.equal(node.dyn_inputs[0].a, 'a')
		assert.equal(node.dyn_inputs[0].index, 0)
		assert.ok(node.dyn_inputs[0].dynamic)
	})
	
	it('adds input slots to given index', function() {
		var node = new Node()
		node.add_slot(0, { a: '1', dt: E2.dt.FLOAT })
		node.add_slot(0, { a: '2', dt: E2.dt.FLOAT })
		node.add_slot(0, { a: '3', dt: E2.dt.FLOAT })
		node.add_slot(0, { a: '4', index: 1, dt: E2.dt.FLOAT})
		assert.equal(node.dyn_inputs[1].a, '4')
	})
	
	it('adds output slots', function() {
		var node = new Node()
		node.add_slot(1, { a: 'a', dt: E2.dt.FLOAT })
		assert.equal(node.dyn_outputs.length, 1)
		assert.ok(node.dyn_outputs[0].dynamic)
		assert.equal(node.dyn_outputs[0].a, 'a')
		assert.equal(node.dyn_outputs[0].index, 0)
	})

	it('finds slots', function() {
		var node = new Node()
		var suid = node.add_slot(0, { a: 'a', dt: E2.dt.FLOAT })

		assert.equal(node.find_dynamic_slot(0, suid).uid, suid)
	})
	
	it('finds slots by uid', function() {
		var node = new Node()
		var suid = node.add_slot(0, { a: 'a', dt: E2.dt.FLOAT })

		assert.equal(node.findSlotByUid(suid).uid, suid)
	})
	
	it('emits slot addition', function(done) {
		var node = new Node()
		node.on('slotAdded', function() {
			done()
		})
		node.add_slot(0, { a: 'a', dt: E2.dt.FLOAT })
	})
	
	it('emits slot removal', function(done) {
		var node = new Node()
		node.on('slotRemoved', function() {
			done()
		})
		var sid = node.add_slot(0, { a: 'a', dt: E2.dt.FLOAT })
		node.remove_slot(0, sid)
	})

})



