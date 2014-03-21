"use strict";

var express = require('express')
var formidable = require('formidable')
var PNG = require('node-png').PNG
var fs = require('fs')
var exec = require('child_process').exec

var frameIndex = 0
var cachePath = './cache';

function lpad(n, width)
{
	n += '';
	
	return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

var app = express()
	.get('/reset', function(req, res) {
		res.setHeader('Access-Control-Allow-Origin', '*');
		console.log('RESET');
		frameIndex = 0;
		exec('rm -f ' + cachePath + '/*.png', function() {
			exec('mkdir -p ' + cachePath);
			res.send(200);
		})
	})
	.post('/', function(req, res) {
		res.setHeader('Access-Control-Allow-Origin', '*');

		if (!req.query.width || !req.query.height) {
			console.error('The client did not specify a width or height');
			return res.send(400);
		}

		var png = new PNG({
			width: req.query.width,
			height: req.query.height,
			filterType: -1
		});

		png.offset = 0
		png.fileName = cachePath + '/'  + lpad(frameIndex++, 8) + '.png';

		console.log('Frame: ' + png.fileName);
		
		var form = new formidable.IncomingForm();
		form.onPart = function(png) { return function(part) {
			part.on('data', function(d) {
				d.copy(png.data, png.offset);
				png.offset += d.length
			})
		}}(png)

		form.on('end', function(png) { return function() {
			png.pack()
				.pipe(fs.createWriteStream(png.fileName))
				.on('close', function() {
					res.send(200);
				});
		}}(png))

		form.parse(req);
	})
	.listen(5000)

console.log('ENGI Framedump Server listening at http://127.0.0.1:5000');
