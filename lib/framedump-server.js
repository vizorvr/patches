"use strict";

var PNG = require('node-png').PNG;
var fs = require('fs');
var exec = require('child_process').exec;

var frameIndex = 0;
var cachePath = './output';

function lpad(n, width) {
	n += '';
	
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function FrameDumpServer() {}
FrameDumpServer.prototype.listen = function(expressApp) {
	expressApp
	.get('/fd/reset', function(req, res) {
		console.log('RESET');
		frameIndex = 0;
		exec('rm -f ' + cachePath + '/*.png', function() {
			exec('mkdir -p ' + cachePath);
			res.send(200);
		})
	})
	.post('/fd/frame', function(req, res) {
		if (!req.query.width || !req.query.height) {
			console.error('The client did not specify a width or height');
			return res.send(400);
		}

		var png = new PNG({
			width: req.query.width,
			height: req.query.height,
			filterType: -1
		});

		var offset = 0;
		var fileName = cachePath + '/'  + lpad(frameIndex++, 8) + '.png';

		req.on('data', function(d) {
			d.copy(png.data, offset);
			offset += d.length;
		});

		req.on('end', function() {
			png.pack()
				.pipe(fs.createWriteStream(fileName))
				.on('close', function() {
					console.log('Frame', fileName);
					res.send(200);
				});
		});
	});
}

exports.FrameDumpServer = FrameDumpServer;
