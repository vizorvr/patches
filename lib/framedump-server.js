"use strict";

var PNG = require('node-png').PNG;
var fs = require('fs');
var exec = require('child_process').exec;
var path = null;
var frameIndex = 0;
var png = null;
var w = 0, h = 0;

function lpad(n, width) {
	n += '';
	
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function flipImage(img, w, h) {
	var wh = w * 4;
	var tmp = new Buffer(wh);

	for (var y=0; y < h / 2; y++) {
		var ry = h-1-y;
		img.copy(tmp, 0, ry * wh, ry * wh + wh);
		img.copy(img, ry * wh, y * wh, y * wh + wh);
		tmp.copy(img, y * wh, 0, wh);
	}

	return img;
}

function FrameDumpServer(project)
{
	path = project + '/output';
	
	if(!fs.existsSync(path))
	    fs.mkdirSync(path);
}

FrameDumpServer.prototype.listen = function(expressApp) {
	expressApp
	.get('/fd/reset', function(req, res) {
		console.log('RESET');
		frameIndex = 0;
		exec('rm -f ' + path + '/*.png', function() {
			exec('mkdir -p ' + path);
			res.send(200);
		})
	})
	.post('/fd/frame', function(req, res) {
		if (!req.query.width || !req.query.height) {
			console.error('The client did not specify a width or height');
			return res.send(400);
		}

		if(!png || w !== req.query.width || h !== req.query.height)
		{
			w = req.query.width;
			h = req.query.height;
			png = new PNG({
				width: req.query.width,
				height: req.query.height,
				filterType: -1
			});
		}

		var offset = 0;
		var fileName = path + '/'  + lpad(frameIndex++, 8) + '.png';

		req.on('data', function(d) {
			d.copy(png.data, offset);
			offset += d.length;
		});

		req.on('end', function() {
			flipImage(png.data, req.query.width, req.query.height);
			
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
