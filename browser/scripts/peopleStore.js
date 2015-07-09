(function() {

var mousePositionLastSentAt = 0

if (typeof(module) !== 'undefined') {
	Store = require('./store')
}

function PeopleStore() {
	Store.apply(this, arguments)

	this.people = {}
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
				break;

			case 'uiMouseClicked':
				that.emit('mouseClicked', uid)
				break;

			case 'uiMouseMoved':
				that.people[uid].x = payload.x
				that.people[uid].y = payload.y

				that.emit('mouseMoved', that.people[uid])
				break;
		}
	})

	E2.app.channel
	.on('leave', function(m) {
		delete that.people[m.id]
		that.emit('removed', m.id)
	})
	.on('join', function(m) {
		if (that.people[m.id])
			return;

		that.people[m.id] = {
			uid: m.id,
			color: m.color,
			activeGraphUid: E2.core.root_graph.uid
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
	var x = e.pageX, y = e.pageY

	if (Date.now() - mousePositionLastSentAt > 60) {
		E2.app.dispatcher.dispatch({
			actionType: 'uiMouseMoved',
			x: x,
			y: y
		})

		mousePositionLastSentAt = Date.now()
	}
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

