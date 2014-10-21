var WebSocketServer = require('ws').Server;
var udp = require('dgram');
var osc = require('osc-min');
var crypto = require('crypto');

var config = require('../config/config.json').server;
var oscPort = config.oscPort || 8001;

function OscServer() {
	this._clients = {}
}

OscServer.prototype.listen = function(httpServer) {
	var self = this;

	var wss = new WebSocketServer({
		server: httpServer,
		path: '/__osc-proxy'
	});

	wss.on('connection', function(ws) {
		var id = crypto.randomBytes(20).toString('hex');
		self._clients[id] = ws;
		ws.on('close', function() {
			self._clients[id] = null;
			delete self._clients[id];
		})
	});

	var oscSocket = udp.createSocket('udp4');
	oscSocket.on('message', this._onUdpMessage.bind(this));
	oscSocket.bind(oscPort);

	console.log('OSC server at port', oscPort);
}

OscServer.prototype._onUdpMessage = function(msg, rinfo) {
	var self = this;
	var oscMessage;

	try {
		oscMessage = osc.fromBuffer(msg);
		delete oscMessage.oscType;
		// console.log('oscMessage', oscMessage);

		var oscJson = JSON.stringify(oscMessage);

		Object.keys(this._clients).forEach(function(id) {
			self._clients[id].send(oscJson);
		});
	} catch (_e) {
		console.error('invalid OSC packet')
	}
}

exports.OscServer = OscServer;
