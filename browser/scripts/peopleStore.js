(function() {

var mousePositionLastSentAt = 0

if (typeof(module) !== 'undefined') {
	Store = require('./store')
}

/**
 * PeopleStore keeps track of people editing the current document.
 * It knows about their active graph, pointer color, position,
 * and when they click.
 *
 * @fires PeopleStore#userFollowed
 * @fires PeopleStore#activeGraphChanged
 * @fires PeopleStore#mouseClicked
 * @fires PeopleStore#mouseMoved
 * @fires PeopleStore#added
 * @fires PeopleStore#removed
 */
function PeopleStore() {
	Store.apply(this, arguments)

	this.people = {}
}

PeopleStore.prototype = Object.create(Store.prototype)

PeopleStore.prototype.initialize = function() {
	var that = this

	document.addEventListener('mousemove', this._mouseMoveHandler.bind(this))
	document.addEventListener('click', this._mouseClickHandler.bind(this))

	var myUid = E2.app.channel.uid

	this.me = this.people[myUid] = {
		uid: myUid,
		activeGraphUid: E2.core.active_graph.uid
	}

	function setOwnGraph(graphUid) {
		that.me.activeGraphUid = graphUid
		that.emit('activeGraphChanged', that.me)
	}

	E2.app.dispatcher.register(function(payload) {
		var uid = payload.from = payload.from || myUid
		var isOwn = payload.from === myUid

		switch(payload.actionType) {
			case 'uiUserIdUnfollowed':
				var person = that.people[uid]
				var target = that.people[payload.followUid]
				person.followUid = null
				target.followers--
				that.emit('userUnfollowed', person, target)
				break;
			case 'uiUserIdFollowed':
				var person = that.people[uid]
				var followee = that.people[payload.followUid]
				if (!followee)
					return;

				person.followUid = payload.followUid

				followee.followers++
	
				if (isOwn)
					setOwnGraph(followee.activeGraphUid)

				that.emit('userFollowed', person, followee)

				break

			case 'uiActiveGraphChanged':
				that.people[uid].activeGraphUid = payload.activeGraphUid
				that.emit('activeGraphChanged', that.people[uid])

				if (isOwn)
					return

				// if I'm following them, change my activeGraph too
				if (that.me.followUid === uid)
					setOwnGraph(payload.activeGraphUid)

				break;

			case 'uiMouseClicked':
				if (isOwn)
					return

				that.emit('mouseClicked', uid)
				break;

			case 'uiMouseMoved':
				if (isOwn)
					return

				that.people[uid].x = payload.x
				that.people[uid].y = payload.y

				that.emit('mouseMoved', that.people[uid])
				break;
		}
	})

	E2.app.channel
	.on('leave', function(m) {
		var person = that.people[m.id]
		if (m.id === E2.app.channel.uid) {
			that.empty()
		} else {
			if (person.followUid)
				that.people[person.followUid].followers--;

			delete that.people[m.id]
			that.emit('removed', m.id)
		}
	})
	.on('join', function(m) {
		if (!that.people[m.id])
			that.people[m.id] = {}

		that.people[m.id].uid = m.id
		that.people[m.id].username = m.username
		that.people[m.id].color = m.color
		that.people[m.id].activeGraphUid = m.activeGraphUid
		that.people[m.id].followers = m.followers || 0

		if (m.id === myUid)
			that.me = that.people[m.id]

		that.emit('added', that.people[m.id])
	})
}

PeopleStore.prototype._mouseClickHandler = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiMouseClicked'
	})
}

PeopleStore.prototype._mouseMoveHandler = function(e) {

	var x = e.pageX
	var y = e.pageY
	var cp = E2.dom.canvas_parent[0]

	// Limit the broadcasted mouse movement area to the canvas
	if (Date.now() - mousePositionLastSentAt > 60 && x > cp.offsetLeft && y > cp.offsetTop) {
		E2.app.dispatcher.dispatch({
			actionType: 'uiMouseMoved',
			x: x + E2.app.scrollOffset[0], // Make sure to add the scroll offset so we're
			y: y + E2.app.scrollOffset[1] // showing the correct place when scrolled.
		})

		mousePositionLastSentAt = Date.now()
	}
}

/**
 * Empties the Store
 * @fires PeopleStore#removed
 */
PeopleStore.prototype.empty = function empty() {
	var that = this
	this.list().map(function(person) {
		that.emit('removed', person.uid)
	})
	this.people = {}
}

PeopleStore.prototype.findByUid = function findByUid(uid) {
	return this.people[uid]
}

PeopleStore.prototype.list = function list() {
	var that = this
	return Object.keys(this.people).map(function(id) {
		return that.people[id]
	})
}

if (typeof(module) !== 'undefined') {
	module.exports = PeopleStore
} else
	window.PeopleStore = PeopleStore

})();

