(function() {

if (typeof(module) !== 'undefined') {
	Store = require('./store')
}

/**
 * PeopleStore keeps track of people editing the current document.
 * It knows about their active graph, pointer color, position,
 * and when they click.
 *
 * @fires PeopleStore#activeGraphChanged
 * @fires PeopleStore#mouseClicked
 * @fires PeopleStore#mouseMoved
 * @fires PeopleStore#added
 * @fires PeopleStore#removed
 */
function PeopleStore() {
	Store.apply(this, arguments)

	this.people = {}
	this.mousePositionLastSentAt = 0
}

PeopleStore.prototype = Object.create(Store.prototype)

PeopleStore.prototype.initialize = function() {
	var that = this

	document.addEventListener('mousemove', this._mouseMoveHandler.bind(this))
	document.addEventListener('click', this._mouseClickHandler.bind(this))

	E2.app.dispatcher.register(function(payload) {
		if (!payload.from || payload.from === E2.app.channel.uid)
			return

		var uid = payload.from

		switch(payload.actionType) {
			case 'uiActiveGraphChanged':
				that.people[uid].activeGraphUid = payload.activeGraphUid
				that.emit('activeGraphChanged', that.people[uid])
				that.people[uid].lastSeen = Date.now()
				break;

			case 'uiMouseClicked':
				that.emit('mouseClicked', uid)
				that.people[uid].lastSeen = Date.now()
				break;

			case 'uiMouseMoved':
				that.people[uid].x = payload.x
				that.people[uid].y = payload.y
				that.people[uid].lastSeen = Date.now()

				that.emit('mouseMoved', that.people[uid])
				break;
		}
	})

	E2.app.channel
	.on('leave', function(m) {
		if (m.id === E2.app.channel.uid) {
			that.empty()
		} else {
			delete that.people[m.id]
			that.emit('removed', m.id)
		}
	})
	.on('join', function(m) {
		if (that.people[m.id])
			return;

		that.people[m.id] = {
			uid: m.id,
			color: m.color,
			activeGraphUid: E2.core.root_graph.uid,
			lastSeen: Date.now()
		}

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

	var adjustedX = x - cp.offsetLeft
	var adjustedY = y - cp.offsetTop

	// Limit the broadcasted mouse movement area to the canvas
	if (Date.now() - this.mousePositionLastSentAt > 60 && adjustedX > -1 && adjustedY > -1) {
		E2.app.dispatcher.dispatch({
			actionType: 'uiMouseMoved',
			x: adjustedX + E2.app.scrollOffset[0],
			y: adjustedY + E2.app.scrollOffset[1]
		})

		this.mousePositionLastSentAt = Date.now()
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

