"use strict";

var express = require('express')
var busboy = require('connect-busboy')
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
	.use(busboy({ immediate: true }))
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

		req.busboy.on('file', function(res, req) { return function(_field, file) {
			if (!req.query.width || !req.query.height) {
				console.error('The client did not specify a width or height');
				return res.end(400);
			}

			var png = new PNG({
				width: req.query.width,
				height: req.query.height,
				filterType: -1
			});

			png.offset = 0;
			png.fileName = cachePath + '/'  + lpad(frameIndex++, 8) + '.png';
			
			file.on('data', function(png) { return function(d) {
				d.copy(png.data, png.offset);
				png.offset += d.length;
				console.log('Offset: ' + png.offset);
			}}(png));

			file.on('end', function(res, png) { return function() {
				console.log('Frame: ' + png.fileName);
				png.pack()
					.pipe(fs.createWriteStream(png.fileName))
					.on('close', function(res) { return function() {
						res.send(200)
					}}(res));
			}}(res, png));
		}}(res, req));
	})
	.listen(5000)

console.log('ENGI Framedump Server listening at http://127.0.0.1:5000');
