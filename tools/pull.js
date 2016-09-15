var request = require('supertest')
var when = require('when')
var fs = require('fs')
var fsPath = require('path')
var assert = require('assert')
var expect = require('chai').expect
var urlParse = require('url').parse
var mongoose = require('mongoose');
var GridFsStorage = require('../lib/gridfs-storage');
var secrets = require('../config/secrets');
var _ = require('lodash')

var E2 = require('../browser/scripts/core').E2

var loadingPlugins = Object.keys(E2.LOADING_NODES)

var argv = require('minimist')(process.argv.slice(2))

if (argv._.length < 1) {
	console.log(`
	usage:

		$ pull [-up] owner/graph-name [local-name]
			-u local username
			-p password 

			pulls the 'owner/graph-name' from the remote to local
			- remote can be full url to the editor, 'user/graph', ...
			- remote defaults to vizor.io

			$ pull fthr/tunnel

			pulls fthr/tunnel from vizor.io to local username/tunnel
	`)

	process.exit(1)
}

var username = argv['u']
var deets = {
	email: username,
	password: argv['p']
}

var parsed = urlParse(argv._[0])
var hn = (parsed.hostname || 'vizor.io') 
	+ ':' + (parsed.port || 80)

var userAndGraph = parsed.path
	.split('.')[0] // remove extensions
	.split('/')

if (userAndGraph[userAndGraph.length-1] === 'edit')
	userAndGraph.pop()

userAndGraph = userAndGraph.slice(-2) // last two parts

var localName = argv._[1] || userAndGraph[1]

userAndGraph = userAndGraph.join('/')

var url = '/data/graph/' + userAndGraph +'.json'

var localHttp = 'http://127.0.0.1:8000'
var remoteHttp = 'http://'+hn
if (localHttp === remoteHttp) {
	console.error('Not writing to source', localHttp, remoteHttp)
	process.exit(1)
}

var remote = request.agent(remoteHttp)
var local = request.agent(localHttp)

function sendGraph(path, graphData, cb) {
	return local.post('/graph').send({
		path: path,
		private: 'false',
		editable: true,
		graph: JSON.stringify(graphData)
	})
	.expect(200)
	.end(cb)
}

function error(err) {
	console.error(err)
}

// --------

function pullAsset(gridFsUrl) {
	var dfd = when.defer()

	console.log('	GET ', gridFsUrl)

	var dpath = gridFsUrl.substring('/data'.length)

	gfs.createWriteStream(dpath)
		.then(function(writeStream) {
			remote.get(gridFsUrl)
				.expect(200)
				.pipe(writeStream)
				.on('close', function() {
					dfd.resolve()
				})
		})

	return dfd.promise
}

var assets = []

function findAssets(subgraph) {
	if (!subgraph.nodes)
		return

	subgraph.nodes.map(function(node) {
		if (node.plugin === 'graph')
			return findAssets(node.graph)

		if (loadingPlugins.indexOf(node.plugin) === -1)
			return;

		assets.push(node.state.url)
	})

	assets = _.uniq(assets)
}

// --------

var gfs

mongoose.connect(secrets.db);
mongoose.connection.on('error', function(err) {
	throw err
})

mongoose.connection.on('connected', (connection) => {	
	gfs = new GridFsStorage('/data')
	gfs.on('ready', function() {
		Step1()
	})
})

function done() {
	console.log('All done!')
	gfs.close()
	mongoose.connection.close()
}

function Step1() {
	local.post('/login.json').send(deets).expect(200)
	.end(function(err, res) {
		console.log('Login:', res ? res.status : res)
		if (err) return error(err)
		Step2()
	})
}

function Step2() {
	console.log('Retrieving:', hn, url)
	remote.get(url).expect(200).end(function(err, res) {
		if (err) return error(err)

		var graph = res.body
		findAssets(graph.root)

		sendGraph(localName, res.body, function(err) {
			if (err)
				return error(err)

			var username = deets.email.split('@')[0]

			when.map(assets, function(asset) {
				return pullAsset(asset)
			})
			.then(function() {
				done()
			})

		})
	})
}

