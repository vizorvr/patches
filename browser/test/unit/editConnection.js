var assert = require('assert');

var EditConnection = require('../../scripts/editConnection')

describe('EditConnection', function() {
	global.E2 = { dt: { ANY: 8 }}

	function Connection(a,b,c,d) {
		this.src_node = a
		this.src_slot = c
		this.dst_node = b
		this.dst_slot = d
	}
	Connection.prototype.create_ui = function() {}

	function makeNode() {
		return {}
	}

	function makeSlot(dt, slotType) {
		return {
			dt: dt,
			type: slotType,
			index: 0
		}
	}	

	it('does not allow connecting to self', function() {
		var isValid = true
		var n1 = makeNode()
		var s1 = makeSlot(0, 0)
		var c = new EditConnection({}, new Connection(n1, null, s1))
		isValid = c.canConnectTo(n1, s1)
		assert.ok(!isValid)
	})

	it('does not allow connecting any to any', function() {
		var isValid = true
		var n1 = makeNode()
		var s1 = makeSlot(8, 1)
		var n2 = makeNode()
		var s2 = makeSlot(8, 0)
		var c = new EditConnection({}, new Connection(n1, null, s1))
		isValid = c.canConnectTo(n2, s2)
		assert.ok(!isValid)
	})

	it('does not allow connecting output to output', function() {
		var isValid = true
		var n1 = makeNode()
		var s1 = makeSlot(8, 1)
		var n2 = makeNode()
		var s2 = makeSlot(2, 1)
		var c = new EditConnection({},
			new Connection(n1, null, s1))
		isValid = c.canConnectTo(n2, s2)
		assert.ok(!isValid)
	})

	it('recognizes right to left', function() {
		var c = new EditConnection({}, new Connection(null, 1, null, 1))
		assert.ok(c.rightToLeft)
	})

	it('does allow connecting left to right', function() {
		var isValid = true
		var n1 = makeNode()
		var s1 = makeSlot(0, 1)
		var n2 = makeNode()
		var s2 = makeSlot(0, 0)
		var c = new EditConnection({}, new Connection(n1, null, s1))
		isValid = c.canConnectTo(n2, s2)
		assert.ok(isValid)
	})

	it('does allow connecting right to left', function() {
		var isValid = true
		var n1 = makeNode()
		var s1 = makeSlot(0, 1)
		var n2 = makeNode()
		var s2 = makeSlot(0, 0)
		var c = new EditConnection({}, new Connection(null, n1, null, s1))
		isValid = c.canConnectTo(n2, s2)
		assert.ok(isValid)
	})



});

