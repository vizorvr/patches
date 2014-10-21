var WebSocketServer = require('ws').Server;
var config = require('../config/config.json').server;
var crypto = require('crypto');

function encode(obj) {
	if (!obj.channel)
	{
		obj.channel = 'server';
	}

	if (!obj.from)
	{
		obj.from = 'server';
	}

	return JSON.stringify(obj)
}

function _onSocketError(err) {
	if (err)
		console.error('Error writing to socket:', err.stack)
}

// ------------------------------------

function WsChannelServer()
{
	this._clients = {};
	this._channels = {};
}

WsChannelServer.prototype.listen = function(httpServer)
{
	var that = this
	this._wss = new WebSocketServer(
	{
		server: httpServer,
		path: '/__wschannel'
	});

	this._wss.on('connection', function(socket)
	{
		var client =
		{
			socket: socket,
			id: crypto.randomBytes(20).toString('hex'),
			channels: []
		};

		that._clients[client.id] = client;
		socket.on('message', that._handleMessage.bind(that, client));
		socket.on('close', function()
		{
			client.channels.forEach(function(ch)
			{
				that.leaveChannel(ch, client);
			});

			delete that._clients[client.id];
		});

		that._send(socket,
		{
			kind: 'READY', data: client.id
		});
	});

	console.log('Channel server ready');
}

WsChannelServer.prototype.close = function()
{
	this._wss.close();
	this._clients = {};
	this._channels = {};
}

WsChannelServer.prototype._handleMessage = function(client, m)
{
	console.log('IN:', m);

	var message = JSON.parse(m);
	message.from = client.id;

	if (!message.channel)
		return;

	switch(message.kind)
	{
		case 'join':
			this.joinChannel(message.channel, client);
			break;
		case 'leave':
			this.leaveChannel(message.channel, client);
			break;
		default:
			this.sendToChannel(message.channel, message, client.id);
			break;
	}
}

WsChannelServer.prototype.joinChannel = function(channelName, client)
{
	var that = this;

	console.log('join', channelName, client.id);

	if (client.channels.indexOf(channelName) !== -1)
		return;

	if (!this._channels[channelName])
		this._channels[channelName] = [];

	var chan = this._channels[channelName];

	client.channels.push(channelName);

	chan.push(client);

	this.sendToChannel(channelName,
	{
		channel: channelName, kind: 'join', data: client.id
	}, client.id);
	
	chan.forEach(function(otherClient)
	{
		if (otherClient.id === client.id)
			return;

		that._send(client.socket,
		{
			channel: channelName, kind: 'join', data: otherClient.id
		});
	});
}

WsChannelServer.prototype.leaveChannel = function(channelName, client)
{
	console.log('leave', channelName, client.id);

	if (!this._channels[channelName] || this._channels[channelName].indexOf(client) === -1)
		return;

	this.sendToChannel(channelName,
	{
		channel: channelName, kind: 'leave', data: client.id
	}, client.id);

	this._channels[channelName] = this._channels[channelName].filter(function(cl)
	{
		return (client.id !== cl.id)
	});

	client.channels = client.channels.filter(function(ch)
	{
		return (ch !== channelName);
	});
}

WsChannelServer.prototype.sendToChannel = function(channelName, message, exceptId)
{
	var that = this;

	if (!this._channels[channelName])
		return;

	this._channels[channelName].forEach(function(client)
	{
		if (exceptId !== client.id)
			that._send(client.socket, message);
	});
}

WsChannelServer.prototype._send = function(socket, message)
{
	console.log('OUT:', message)
	socket.send(encode(message), _onSocketError)
}

exports.WsChannelServer = WsChannelServer;
