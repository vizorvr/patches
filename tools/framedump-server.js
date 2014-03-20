"use strict";

var express = require('express')
var busboy = require('connect-busboy')
var PNG = require('node-png').PNG
var fs = require('fs')
var exec = require('child_process').exec

var frameIndex = 0
var cachePath = './cache';

function lpad(n, width) {
	n += '';
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

var app = express()
	.use(busboy({ immediate: true }))
	.get('/reset', function(req, res) {
		console.log('RESET')
		frameIndex = 0
		exec('rm -f ' + cachePath + '/*.png', function() {
			exec('mkdir -p ' + cachePath)
			res.send(200)
		})
	})
	.post('/', function(req, res) {
		var offset = 0

		req.busboy.on('file', function(_field, file) {
			if (!req.query.width || !req.query.height) {
				console.error('The client did not specify a width or height')
				return res.end(400)
			}

			var framePngName = cachePath + '/' +lpad(frameIndex++, 8) + '.png';

			var png = new PNG({
				width: req.query.width,
				height: req.query.height,
				filterType: -1
			});

			file.on('data', function(png) { return function(d) {
				d.copy(png.data, offset)
				offset += d.length
			}}(png));

			file.on('end', function(png) { return function() {
				console.log('Frame', framePngName)
				png.pack()
					.pipe(fs.createWriteStream(framePngName))
					.on('close', function() {
						res.set('Access-Control-Allow-Origin', '*')
						res.send(200)
					});
			}}(png));
		})
	})
	.listen(5000)

console.log('ENGI Framedump Server listening at http://127.0.0.1:5000');
