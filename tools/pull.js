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
			-u local user email
			-p password

			pulls the 'owner/graph-name' from the remote to local
			- remote can be full url to the editor, 'user/graph', ...
			- remote defaults to patches.vizor.io

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
var hn = (parsed.hostname || 'patches.vizor.io')
	+ ':' + (parsed.port || 443)

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
var remoteHttp = 'https://'+hn
var cdnHttp = 'https://cdn.vizor.io:443'
var remote = request.agent(remoteHttp)
var cdn = request.agent(cdnHttp)
var local = request.agent(localHttp)

if (localHttp === remoteHttp) {
	console.error('Not writing to source', localHttp, remoteHttp)
	process.exit(1)
}

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
	throw err
}

// --------

function mirror(remoteUrl, i, realName) {
	var dfd = when.defer()
	let agent = remoteUrl.indexOf('/data') === 0 ? cdn : remote
	let getUrl = remoteUrl.replace(/^\/data/, '')
	let dest = getUrl
	if (realName)
		dest = realName

	agent.head(getUrl)
	.end((err, head) => {
		if (err)
			return dfd.reject(err)

		if (head.statusCode !== 200)
			console.log('  HEAD ', getUrl, head.statusCode)

		if (head.statusCode === 301) {
			let redUrl = head.headers.location.replace('https://cdn.vizor.io', '/data')
			console.log('  REDIRECT', redUrl)
			return mirror(redUrl, 0, getUrl).then(() => { return dfd.resolve(getUrl) })
		}

		if (head.statusCode === 404)
			return dfd.resolve()

		console.log('GET ', getUrl, 'from', agent === cdn ? 'cdn' : 'site', dest)

		if (getUrl.indexOf('.obj') !== -1) {
			var mtlUrl = getUrl.replace('.obj', '.mtl')
			dfd.promise.then(() => { return mirror(mtlUrl) })
		}

		if (getUrl.indexOf('.ogg') !== -1) {
			var m4aUrl = getUrl.replace('.ogg', '.m4a')
			dfd.promise.then(() => { return mirror(m4aUrl) })
		}

		if (remoteUrl.indexOf('/data') === 0) {
			var metaUrl = '/meta' + getUrl
			dfd.promise.then(() => { return mirror(metaUrl) })
		}

		gfs.createWriteStream(dest)
		.then(function(writeStream) {
			agent.get(getUrl)
			.pipe(writeStream)
			.on('close', () => {
				console.log('  OK', remoteUrl)
				dfd.resolve(getUrl)
			})
		})

	})

	return dfd.promise
}

var assets = []

function findAssets(subgraph) {
	if (!subgraph.nodes)
		return

	subgraph.nodes.map(function(node) {
		if (E2.GRAPH_NODES.indexOf(node.plugin) > -1)
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
	cdnUrl = url.replace(/^\/data/, '')
	cdn.get(cdnUrl).expect(200).end(function(err, res) {
		if (err) return error(err)

		var graph = res.body
		findAssets(graph.root)

		sendGraph(localName, res.body, function(err) {
			if (err)
				return error(err)

			var username = deets.email.split('@')[0]

			when.map(assets, mirror)
			.then(function() {
				done()
			})

		})
	})
}
