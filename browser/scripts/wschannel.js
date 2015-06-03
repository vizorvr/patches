
function WebSocketChannel() {
	EventEmitter.call(this)
	this._listeners = {};
	this._state = 'disconnected';
}

WebSocketChannel.prototype = Object.create(EventEmitter.prototype)

WebSocketChannel.prototype.connect = function(path) {
	var that = this;

	path = path || '/__wschannel'

	if (this._state === 'connected' || this._state === 'connecting') {
		return;
	}

	this._state = 'connecting';

	this.ws = new WebSocket('ws://'+
		window.location.hostname+':'+
		(window.location.port || 80)+
		path);

	this.ws.onopen = function() {
		console.log('WsChannel connected', path);
		that._state = 'connected';
		that.emit('connected')
	};

	this.ws.onclose = function() {
		console.warn('WsChannel disconnected', path);
		that._state = 'disconnected';
	};

	this.ws.onmessage = function(evt) {
		var m = JSON.parse(evt.data);
		var dk = Object.keys(m)[0]

		console.log('IN:', m[dk], evt.data.length+'b', 'from', m.from, m);

		if (m.kind === 'READY') {
			that.uid = m.data
			that.emit('ready', that.uid)
		}

		that.emit('*', m)
		that.emit(m.channel, m)
	};

	return this
}

WebSocketChannel.prototype.join = function(channel)
{
	if (this._state !== 'connected')
		return;

	console.log('WsChannel.join',channel)

	this.ws.send(JSON.stringify({ kind: 'join', channel: channel }))
	return this
}

WebSocketChannel.prototype.send = function(channel, data) {
	if (this._state !== 'connected')
		return;

	if (typeof(data) !== 'object') {
		data = { kind: data };
	}

	data.channel = channel;

	console.log('OUT:', channel, data)
	this.ws.send(JSON.stringify(data));

	return this
}

