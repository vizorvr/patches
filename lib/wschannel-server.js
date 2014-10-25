var WebSocketServer = require('ws').Server;
var config = require('../config.json').server;
var crypto = require('crypto');

function encode(obj)
{
	if(!obj.channel)
		obj.channel = 'server';

	if(!obj.from)
		obj.from = 'server';

	return JSON.stringify(obj);
}

function onSocketError(err)
{
	if(err)
		console.error('Error writing to socket:', err.stack)
}

function WsChannelServer(config)
{
	this.config = config;
	this.clients = {};
	this.channels = {};
}

WsChannelServer.prototype.listen = function(httpServer)
{
	this.wss = new WebSocketServer(
	{
		server: httpServer,
		path: '/__wschannel'
	});

	this.wss.on('connection', function(socket)
	{
		var client =
		{
			socket: socket,
			id: crypto.randomBytes(20).toString('hex'),
			channels: []
		};

		this.clients[client.id] = client;
		socket.on('message', this.handleMessage.bind(this, client));
		socket.on('close', function()
		{
			for(var ch in client.channels)
				this.leaveChannel(ch, client);

			delete this.clients[client.id];
		}.bind(this));

		this.send(socket,
		{
			kind: 'READY', data: client.id
		});
	}.bind(this));

	console.log('Channel server ready');
}

WsChannelServer.prototype.close = function()
{
	this.wss.close();
	this.clients = {};
	this.channels = {};
};

WsChannelServer.prototype.handleMessage = function(client, m)
{
	if(this.config.debug)
		console.log('WS In:', m);

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
};

WsChannelServer.prototype.joinChannel = function(channelName, client)
{
	if(this.config.debug)
		console.log('WS Join:', channelName, client.id);

	if(client.channels.indexOf(channelName) !== -1)
		return;

	if(!this.channels[channelName])
		this.channels[channelName] = [];

	var chan = this.channels[channelName];

	client.channels.push(channelName);
	chan.push(client);

	this.sendToChannel(channelName,
	{
		channel: channelName, kind: 'join', data: client.id
	}, client.id);
	
	for(var ch in chan)
	{
		var oc = chan[ch];
		
		if(oc.id === client.id)
			return;

		this.send(client.socket,
		{
			channel: channelName, kind: 'join', data: oc.id
		});
	}
};

WsChannelServer.prototype.leaveChannel = function(channelName, client)
{
	if(this.config.debug)
		console.log('WS Leave:', channelName, client.id);

	if(!this.channels[channelName] || this.channels[channelName].indexOf(client) === -1)
		return;

	this.sendToChannel(channelName,
	{
		channel: channelName, kind: 'leave', data: client.id
	}, client.id);

	this.channels[channelName] = this.channels[channelName].filter(function(cl)
	{
		return (client.id !== cl.id)
	});

	client.channels = client.channels.filter(function(ch)
	{
		return (ch !== channelName);
	});
};

WsChannelServer.prototype.sendToChannel = function(channelName, message, exceptId)
{
	if(!this.channels[channelName])
		return;

	this.channels[channelName].forEach(function(client)
	{
		if(exceptId !== client.id)
			this.send(client.socket, message);
	}.bind(this));
};

WsChannelServer.prototype.send = function(socket, message)
{
	if(this.config.debug)
		console.log('Ws Out:', message);
		
	socket.send(encode(message), onSocketError);
};

exports.WsChannelServer = WsChannelServer;
