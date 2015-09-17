var request = require('supertest')
var when = require('when')
var fs = require('fs')
var fsPath = require('path')
var assert = require('assert')
var expect = require('chai').expect
var urlParse = require('url').parse

var argv = require('minimist')(process.argv.slice(2))

if (argv._.length < 3) {
	console.log(`
	usage:

		$ upload [-up] <folder> <remote> <assetType>
			-u local username
			-p password 

			uploads everything in <folder> to <remote> / <assetType>
			- remote defaults to localhost
			- assetType is image, scene, audio, json, ...

		$ node tools/upload.js /Downloads/JPEG/ localhost:8000 image
	`)

	process.exit(1)
}

var username = argv.u
var deets = {
	email: username,
	password: argv.p
}

var folder = argv._[0]
var remote = argv._[1]
var assetType = argv._[2]

var remoteHttp = 'http://' + remote

var remote = request.agent(remoteHttp)

function upload(path) {
	var dfd = when.defer()

	var stream = fs.createReadStream(path)

	console.log('-- uploading', path)

	return remote.post('/upload/'+assetType)
	.attach('file', stream, path)
	.expect(200)
	.end(function(err) {
		if (err)
			return dfd.reject(err)

		console.log('	done', path)

		dfd.resolve()
	})

	return dfd.promise
}

function error(err) {
	console.error(err)
}

// --------

function Step1() {
	remote.post('/login.json').send(deets).expect(200)
	.end(function(err, res) {
		console.log('Login:', res ? res.status : res)
		if (err) return error(err)
		Step2()
	})
}

function Step2() {
	when.map(fs.readdirSync(folder), function(item) {
		if (item[0] === '.')
			return;

		var fullpath = fsPath.resolve(folder, item)
		
		return upload(fullpath)
	})
}

Step1()

