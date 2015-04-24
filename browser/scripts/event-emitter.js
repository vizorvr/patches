function EventEmitter() {
	this._listeners = {}
}
EventEmitter.prototype.mute = function(muted) {
	this.mute = muted
}

EventEmitter.prototype.on = function(kind, cb) {
	if (!cb)
		return

	if (!this._listeners[kind])
		this._listeners[kind] = []

	this._listeners[kind].push(cb)

	return this
}

EventEmitter.prototype.off = function(kind, cb) {
	if (!this._listeners[kind])
		return

	this._listeners[kind] = this._listeners[kind].filter(function(c) {
		return c !== cb
	})

	return this
}

EventEmitter.prototype.emit = function(kind) {
	if (!this._listeners[kind])
		return

	var that = this

	var emitArguments = Array.prototype.splice.call(arguments, 1)

	this._listeners[kind].forEach(function(cb) {
		cb.apply({}, emitArguments)
	})

	return this
}

if (typeof(module) !== 'undefined')
	module.exports = EventEmitter
