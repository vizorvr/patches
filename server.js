"use strict";

var http = require('http');
var express = require('express');
var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var FrameDumpServer = require('./lib/framedump-server').FrameDumpServer;
var OscServer = require('./lib/osc-server').OscServer;
var config = require('./config.json');

var ENGI = config.server.engiPath;
var PROJECT = argv._[0] || ENGI;
var listenHost = argv.i || config.server.host;
var listenPort = argv.p || config.server.port;
var publishRunning = []; // The current set of projects being published.

if(argv.h || argv.help)
{
	return console.log('Usage: node server.js -i 127.0.0.1 -p 8000 [/path/to/alt/project]')
}

console.log('Project path: ', PROJECT);
console.log('URL: http://' + listenHost + ':' + listenPort);

function showFolderListing(reTest)
{
	return function(req, res, next)
	{
		fs.readdir(PROJECT + req.path, function(err, files)
		{
			if(err)
			{
				console.warn(err.stack);
				files = [];
			}

			res.send(files.filter(function(file)
			{
				return reTest.test(file);
			}));
		});
	};
}

function downloadHandler(req, res)
{
	var path = PROJECT + decodeURIComponent(req.path.substring(3));

	fs.exists(path, function(exists)
	{
		if(!exists)
			return res.send(404);

		res.header('Content-Type', 'application/octet-stream');
		fs.createReadStream(path).pipe(res);
	});
}

function emitError(res, code, msg)
{
	res.writeHead(code, { 'content-type': 'text/html' });
	res.write(msg);
	res.end();
}

function emitSuccess(res, msg)
{
	res.status(200);
	res.json({ msg: msg });
	res.end();
}

function publishProject(res, seq, data_path)
{
	if(publishRunning.indexOf(seq) !== -1)
	{
		console.log('Cannot publish "' + seq + '": This project is already being published.');
		emitSuccess(res, 'This project is already being published.');
		return;
	}
	
	publishRunning.push(seq);
	console.log('Publishing project: ' + seq);
	
	exec('node ' + path.join('tools', 'publish-seq') + ' ' + seq + ' ' + data_path, function(seq) { return function(error, stdout, stderr)
	{
		publishRunning.splice(publishRunning.indexOf(seq), 1);
		
		if(error)
		{
			console.log(error.toString());
			emitError(res, 500, error.toString());
			return;
		}
		
		emitSuccess(res, 'The project was successfully published.')
	}}(seq));
}

var app = express()
	.use(express.logger(':remote-addr :method :url :status :res[content-length] - :response-time ms'))
	.use(function(req, res, next)
	{
		if(req.url.indexOf('?_') > -1)
			req.url = req.url.substring(0, req.url.indexOf('?_'));
		
		next();
	})
	.use(express['static'](ENGI, { maxAge: 60 * 60 * 24 * 1000 }))
	.use(express['static'](PROJECT, { maxAge: 0 }))
	.use('/node_modules',
		express['static'](__dirname+'/node_modules',
			{ maxAge: 60 * 60 * 24 * 1000 }))
	// set no-cache headers for the rest
	.use(function(req, res, next)
	{
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
		res.setHeader('Expires', 0);
		next();
	})
	.get(/^\/data\/(graphs|textures|scenes|audio|video|jsons)\/$/, showFolderListing(/^[^.].*$/))
	.get(/^\/dl\/data\/(graphs|textures|audio|video|jsons)\/[^\/]*$/, downloadHandler)
	.post(/^\/data\/graphs\/[^\/]*\.json$/, function(req, res, next)
	{
		var savePath = decodeURIComponent(req.path)
			.replace(/graphs\/[^a-zA-Z0-9\ \.\-\_]/, '_');

		if (!/\.json$/.test(savePath))
			savePath = savePath+'.json';

		var stream = fs.createWriteStream(PROJECT + savePath);
		
		stream.on('error', next)
		stream.on('close', function()
		{
			if(req.get('Engi-Publish') === 'true')
				publishProject(res, PROJECT + savePath, PROJECT);
			else
				res.send({}); // reply with an empty object
		});
		
		req.pipe(stream);
	});

app.use(express.errorHandler());

if(config.server.enableFrameDumping)
	new FrameDumpServer().listen(app);

var httpServer = http.createServer(app)

httpServer.listen(listenPort, listenHost);

if(config.server.enableOSC)
	new OscServer().listen(httpServer);
