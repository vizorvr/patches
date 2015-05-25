
function WebSocketChannel() {
	EventEmitter.call(this)
	this._listeners = {};
	this._state = 'disconnected';
	this.ws;
}

WebSocketChannel.prototype = Object.create(EventEmitter.prototype)

WebSocketChannel.prototype.connect = function() {
	var that = this;

	if (this._state === 'connected' || this._state === 'connecting') {
		return;
	}

	this._state = 'connecting';

	this.ws = new WebSocket('ws://'+
		window.location.hostname+':'+
		(window.location.port || 80)+
		'/__wschannel');

	this.ws.onopen = function() {
		console.log('WsChannel connected');
		that._state = 'connected';
		that.emit('connected')
	};

	this.ws.onclose = function()
	{
		console.warn('WsChannel disconnected!');
		that._state = 'disconnected';
	};

	this.ws.onmessage = function(evt) {
		var m = JSON.parse(evt.data);
		console.log('IN:', m);

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

WebSocketChannel.prototype.send = function(channel, data)
{
	if (this._state !== 'connected')
		return;

	if (typeof(data) !== 'object')
	{
		data = { kind: data };
	}

	data.channel = channel;

	this.ws.send(JSON.stringify(data));
}

// connect automatically

console.log('Connecting WebSocketChannel');

window.wsChannel = new WebSocketChannel();
window.wsChannel.connect();
