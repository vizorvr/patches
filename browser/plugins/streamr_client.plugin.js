(function() {

var StreamrClientPlugin = function(core) {
	Plugin.apply(this, arguments)

	var that = this

	this.desc = 'Client for consuming Streamr.com streams.'

	this.input_slots = [{
		name: 'streamId',
		dt: E2.dt.TEXT,
		desc: 'The ID of the Streamr stream to consume.'
	}]

	this.output_slots = [{
		name: 'trigger',
		dt: E2.dt.BOOL,
		desc: 'Triggers (becomes true) for one frame any time a message is received'
	}, {
		name: 'message',
		dt: E2.dt.OBJECT,
		desc: 'A parsed message entry from the stream.'
	}]

	core.add_aux_script('socket.io/socket.io-1.3.7.js')
	.then(function() {
		return core.add_aux_script('streamr/streamr-client.js')
	})
	.then(function() {
		console.log('construct client')
		that._streamr = new StreamrClient()
		that.subscribe()
	})
	.catch(function(err) {
		console.error(err.stack)
	})

	this.message = null
	this.trigger = false
}

StreamrClientPlugin.prototype = Object.create(Plugin.prototype)

StreamrClientPlugin.prototype.reset = function() {
	this.changed = false
}

StreamrClientPlugin.prototype.update_input = function() {
	console.log('update_input')
	if (!this.subscription)
		this.subscribe()
}

StreamrClientPlugin.prototype.update_state = function() {
	console.log('update_state')
	console.log('update_state()', this.inputValues.streamId, !!this.subscription)

	if (!this.node.queued_update)
		this.trigger = false
}

StreamrClientPlugin.prototype.update_output = function(slot) {
	switch(slot.name) {
		case 'trigger':
			return this.trigger
		case 'message':
			return this.message
	}
}

StreamrClientPlugin.prototype.subscribe = function() {
	var that = this
	console.log('subscribe()', this.inputValues.streamId, !!this._streamr)

	if (!this.inputValues.streamId || !this._streamr)
		return;

	if (this.subscription)
		this._streamr.unsubscribe(this.subscription)

	this.subscription = this._streamr.subscribe(this.inputValues.streamId,
		function(message, streamId, timestamp, counter) {
			console.log('streamr:', message, counter)
			that.message = message
			that.trigger = true
			that.updated = true
			that.node.queued_update = 1
		})

	this._streamr.connect()
}

E2.plugins.streamr_client = StreamrClientPlugin

if (typeof(module) !== 'undefined')
	module.exports = StreamrClientPlugin

})()

