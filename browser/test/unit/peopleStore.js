global.EventEmitter = require('events').EventEmitter
global.sinon = require('sinon')
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
		},
		scrollOffset: [0, 0]
	},
	dom: {
		canvas_parent: [{
			offsetLeft: 32,
			offsetTop: 32
		}]
	}
}

E2.app.channel.setMaxListeners(0)

var assert = require('assert')
var PeopleStore = require('../../scripts/peopleStore')

describe('PeopleStore', function() {
	var ps

	beforeEach(function() {
		E2.app.channel.uid = 'me'
		ps = new PeopleStore()
		ps.initialize()
	})

	it('handles join', function() {
		E2.app.channel.emit('join', {
			id: 'jep',
			color: 'color',
			activeGraphUid: 'woo'
		})

		assert.equal(ps.people.jep.color, 'color')
		assert.equal(ps.people.jep.activeGraphUid, 'woo')
		assert.equal(ps.list().length, 2)
	})

	it('handles leave', function() {
		E2.app.channel.emit('join', { id: 'jeh' })
		assert.equal(ps.list().length, 2)
		E2.app.channel.emit('leave', { id: 'jeh' })
		assert.equal(ps.list().length, 1)
	})

	it('leave by the user should empty people on the channel, except self', function() {
		E2.app.channel.uid = 'foo'
		E2.app.channel.emit('join', { id: 'bar'})
		E2.app.channel.emit('join', { id: 'baz'})
		E2.app.channel.emit('join', { id: 'foo'})
		E2.app.channel.emit('leave', { id: 'foo' })
		assert.equal(ps.list().length, 1)
	})

	it('emptying should emit removes for all people', function(done) {
		var i = 0
		E2.app.channel.uid = 'foo'
		E2.app.channel.emit('join', { id: 'foo'})
		E2.app.channel.emit('join', { id: 'bar'})
		E2.app.channel.emit('join', { id: 'baz'})
		ps.on('removed', function() {
			if (++i===3)
				done()
		})
		E2.app.channel.emit('leave', { id: 'foo' })
	})

	it('empties on disconnect, except self', function() {
		E2.app.channel.emit('join', { id: 'foo'})
		E2.app.channel.emit('join', { id: 'bar'})
		E2.app.channel.emit('disconnected')
		assert.equal(ps.list().length, 1)
	})

	it('can list people', function() {
		E2.app.channel.emit('join', { id: 'foo'})
		E2.app.channel.emit('join', { id: 'bar'})
		assert.equal(ps.list()[1].uid, 'foo')
		assert.equal(ps.list()[2].uid, 'bar')
	})

	it('can find people', function() {
		E2.app.channel.emit('join', { id: 'foo'})
		assert.equal(ps.findByUid('foo').uid, 'foo')
	})

	it('dispatches on mousemove when over the canvas', function(done) {
		global.E2.app.dispatcher.dispatch = function(pl) {
			assert.equal(pl.actionType, 'uiMouseMoved')
			assert.equal(pl.x, 32)
			assert.equal(pl.y, 32)
			done()
		}

		ps._mouseMoveHandler.call(ps, { pageX: 64, pageY: 64 })
	})

	it('does not dispatch on mousemove when not over the canvas', function(done) {

		global.E2.app.dispatcher.dispatch = function(pl) {
			if (pl.actionType === 'uiMouseMoved')
				done(new Error('uiMouseMoved received'))			
		}

		ps._mouseMoveHandler.call(ps, { pageX: 16, pageY: 16 })
		done()

	})

	it('updates lastSeen when joined', function() {

		E2.app.channel.emit('join', { id: 'foo'})
		assert.ok(ps.findByUid('foo').lastSeen > 1000)

	})

	it('updates lastSeen when user moves their mouse', function() {

		var lastSeenWhenJoined
		var lastSeenAfterMousemove

		E2.app.channel.emit('join', { id: 'antero'})
		lastSeenWhenJoined = ps.findByUid('antero').lastSeen

		var clock = sinon.useFakeTimers(lastSeenWhenJoined + 100);

		dispatchListener({
			from: 'antero',
			actionType: 'uiMouseMoved',
			x: 64,
			y: 64
		})

		lastSeenAfterMousemove = ps.findByUid('antero').lastSeen
		assert.notEqual(lastSeenWhenJoined, lastSeenAfterMousemove)

		clock.restore()

	})

	it('updates lastSeen when user clicks', function() {

		var lastSeenWhenJoined
		var lastSeenAfterClick

		E2.app.channel.emit('join', { id: 'antero'})
		lastSeenWhenJoined = ps.findByUid('antero').lastSeen

		var clock = sinon.useFakeTimers(lastSeenWhenJoined + 100);

		dispatchListener({
			from: 'antero',
			actionType: 'uiMouseClicked'
		})

		lastSeenAfterClick = ps.findByUid('antero').lastSeen
		assert.notEqual(lastSeenWhenJoined, lastSeenAfterClick)

		clock.restore()

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

	it('changes follower`s active graph on uiActiveGraphChanged', function() {
		E2.app.channel.emit('join', { id: 'foo' })
		ps.me.followUid = 'foo'

		dispatchListener({
			from: 'foo',
			actionType: 'uiActiveGraphChanged',
			activeGraphUid: 'abc'
		})

		assert.equal(ps.people.foo.activeGraphUid, 'abc')
		assert.equal(ps.me.activeGraphUid, 'abc')
	})

	it('changes my active graph from a follow', function(done) {
		E2.app.channel.emit('join', { id: 'foo'})
		ps.me.activeGraphUid = 'nope'
		ps.me.followUid = 'foo'

		ps.on('activeGraphChanged', function(p) {
			if (p.uid !== 'me')
				return;

			if (p.activeGraphUid === 'abc')
				done()
		})

		dispatchListener({
			from: 'foo',
			actionType: 'uiActiveGraphChanged',
			activeGraphUid: 'abc'
		})

	})

	it('marks followee as followed', function() {
		E2.app.channel.emit('join', { id: 'foo', activeGraphUid: 'g' })

		dispatchListener({
			from: 'me',
			actionType: 'uiUserIdFollowed',
			followUid: 'foo'
		})

		assert.equal(ps.me.activeGraphUid, 'g')
		assert.equal(ps.me.followUid, 'foo')
		assert.equal(ps.findByUid('foo').followers, 1)
	})


	it('clears followee on follower leave', function() {
		E2.app.channel.emit('join', { id: 'foo' })
		ps.people.foo.followUid = 'me'
		ps.me.followers = 5

		E2.app.channel.emit('leave', { id: 'foo' })

		assert.equal(ps.me.followers, 4)
	})

})
