
function WebSocketChannel() {
	this._listeners = {};
	this._state = 'disconnected';
	this.ws;
}

WebSocketChannel.prototype.connect = function()
{
	var that = this;

	if (this._state === 'connected' || this._state === 'connecting')
		return;

	this._state = 'connecting';

	this.ws = new WebSocket('ws://'+
		window.location.hostname+':'+
		(window.location.port || 80)+
		'/__wschannel');

	this.ws.onopen = function()
	{
		console.log('WsChannel connected');
		that._state = 'connected';
	};

	this.ws.onclose = function()
	{
		console.warn('WsChannel disconnected!');
		that._state = 'disconnected';
	};

	this.ws.onmessage = function(evt) {
		var m = JSON.parse(evt.data);
		console.log('IN:', m);

		if (that._listeners['*'])
			that._listeners['*'](m);

		if (!that._listeners[m.channel])
			return;

		if (that._listeners[m.channel])
			that._listeners[m.channel](m);
	};
}

WebSocketChannel.prototype.join = function(channel)
{
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

WebSocketChannel.prototype.on = function(channel, fn)
{
	this._listeners[channel] = fn;
}

WebSocketChannel.prototype.off = function(channel)
{
	delete this._listeners[channel];
}

// connect automatically

console.log('Connecting WebSocketChannel');

window.wsChannel = new WebSocketChannel();
window.wsChannel.connect();
