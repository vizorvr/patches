"use strict";

var fspath = require('path')
var connect = require('express')
var fs = require('fs')
var WEBROOT = './browser/'

console.log('using webroot ', WEBROOT)

function showFolderListing(reTest) {
	return function(req, res) {
		console.log('showFolderListing', req.path)

		fs.readdir(WEBROOT + req.path, function(err, files) {
			if (err)
				return next(err)

			res.send(files.filter(function(file) {
				return reTest.test(file)
			}))
		})
	}
}

var app = connect()

	.use(connect.logger(':remote-addr :method :url :status :res[content-length] - :response-time ms'))

	.use(function(req, res, next) {
		if (req.url.indexOf('?_') > -1)
			req.url = req.url.substring(0, req.url.indexOf('?_'))
		next()
	})

	// Static files (plugins, graphs, textures, ...)
	.use(connect['static'](WEBROOT))

	// Textures
	.get('/data/textures', showFolderListing(/^[^.].*$/))

	// Graphs
	.get('/graphs', showFolderListing(/\.json$/))
	.post(/\/graphs\/.*/, function(req, res, next) {
		var savePath = decodeURIComponent(req.path)
			.replace(/graphs\/[^a-zA-Z0-9\ \.\-\_]/, '_')

		if (!/\.json$/.test(savePath))
			savePath = savePath+'.json'

		var stream = fs.createWriteStream(WEBROOT + savePath)

		stream.on('error', next)
		stream.on('close', function() {
			res.send({})
		})

		req.pipe(stream)
	})

	.use(connect.errorHandler())

	.listen(8000, '127.0.0.1')


