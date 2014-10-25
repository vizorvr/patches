var WebSocketServer = require('ws').Server;
var udp = require('dgram');
var osc = require('osc-min');
var crypto = require('crypto');

var config = require('../config.json').server;
var oscPort = config.oscPort || 8001;

function OscServer(config)
{
	this.clients = {}
	this.config = config;
}

OscServer.prototype.listen = function(httpServer)
{
	var wss = new WebSocketServer(
	{
		server: httpServer,
		path: '/__osc-proxy'
	});

	wss.on('connection', function(ws)
	{
		var id = crypto.randomBytes(20).toString('hex');
		
		this.clients[id] = ws;
		
		if(this.config.debug)
			console.log('OSC registered client:', id);

		ws.on('close', function()
		{
			delete this.clients[id];
		}.bind(this))
	}.bind(this));

	var oscSocket = udp.createSocket('udp4');
	
	oscSocket.on('message', this.onUdpMessage.bind(this));
	oscSocket.bind(oscPort);

	if(this.config.debug)
		console.log('OSC server at port:', oscPort);
}

OscServer.prototype.onUdpMessage = function(msg, rinfo)
{
	try
	{
		var oscMsg = osc.fromBuffer(msg);
		
		delete oscMsg.oscType;

		var oscJson = JSON.stringify(oscMsg);

		for(var id in this.clients)
			this.clients[id].send(oscJson);
	}
	catch(e)
	{
		if(this.config.debug)
			console.error('OSC packet invalid:' + e)
	}
}

exports.OscServer = OscServer;
