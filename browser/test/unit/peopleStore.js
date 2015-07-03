global.EventEmitter = require('events').EventEmitter
global.document = { addEventListener: function() {} }

var dispatchListener

global.E2 = {
	core: {
		root_graph: { uid: 'root_graph' },
		active_graph: { uid: 'root_graph' }
	},
	app: {
		channel: new EventEmitter(),
		dispatcher: {
			register: function(cb) {
				dispatchListener = cb
			}
		}
	}
}

var assert = require('assert')
var PeopleStore = require('../../scripts/peopleStore')

describe('PeopleStore', function() {
	var ps

	beforeEach(function() {
		ps = new PeopleStore()
		ps.initialize()
	})

	it('handles join', function() {
		E2.app.channel.emit('join', {
			id: 'jep',
			color: 'color'
		})

		assert.equal(ps.people.jep.color, 'color')
		assert.equal(ps.people.jep.activeGraphUid, 'root_graph')
	})

	it('handles leave', function() {
		E2.app.channel.emit('join', { id: 'jeh' })
		assert.equal(ps.list().length, 1)
		E2.app.channel.emit('leave', { id: 'jeh' })
		assert.equal(ps.list().length, 0)
	})

	it('can list people', function() {
		E2.app.channel.emit('join', { id: 'foo'})
		E2.app.channel.emit('join', { id: 'bar'})
		assert.equal(ps.list()[0].uid, 'foo')
		assert.equal(ps.list()[1].uid, 'bar')
	})

	it('can find people', function() {
		E2.app.channel.emit('join', { id: 'foo'})
		assert.equal(ps.findByUid('foo').uid, 'foo')
	})

	it('dispatches on mousemove', function(done) {
		global.E2.app.dispatcher.dispatch = function(pl) {
			assert.equal(pl.actionType, 'uiMouseMoved')
			assert.equal(pl.x, 32)
			assert.equal(pl.y, 64)
			done()
		}

		ps._mouseMoveHandler.call(ps, { pageX: 32, pageY: 64 })
	})

	it('changes active graph on uiActiveGraphChanged', function() {
		E2.app.channel.emit('join', { id: 'foo'})

		dispatchListener({
			from: 'foo',
			actionType: 'uiActiveGraphChanged',
			activeGraphUid: 'abc'
		})

		assert.equal(ps.people.foo.activeGraphUid, 'abc')
	})


})
