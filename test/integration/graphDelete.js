var testId = rand()
var DBNAME = 'graphDelete'+testId

process.env.MONGODB = 'mongodb://localhost:27017/'+DBNAME
process.env.GRAPHCONTROLLER_PAGE_SIZE = 3

var request = require('supertest')
var app = require('../../app.js')
var fs = require('fs')
var assert = require('assert')
var expect = require('chai').expect

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../../package.json'))
var currentVersion = packageJson.version.split('.').slice(0,2).join('.')

var mongo = require('mongodb')

var when = require('when')
var guard = require('when/guard')

function rand() {
	return Math.floor(Math.random() * 10000)
}

function range(howmany) {
	var a = []
	for (var i=0; i < howmany; i++)
		a.push(i)
	return a
}

describe('Graph delete', function() {
	var username = 'user'+rand()
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}

	var anonymousAgent = request.agent(app)
	var agent = request.agent(app)
	var db

	function sendGraph(path) {
		var dfd = when.defer()

		agent.post('/graph').send({
			path: path,
			graph: graphData,
			isPublic: true
		})
		.expect(200)
		.end(function(err) {
			if (err)
				return dfd.reject(err)

			dfd.resolve()
		})

		return dfd.promise
	}

	before(function(done) {
		app.events.on('ready', function() {
			db = new mongo.Db(DBNAME,
				new mongo.Server('localhost', 27017),
				{ safe: true }
			)

			db.open(function() {
				agent
				.post('/signup')
				.send(deets)
				.expect(302)
				.end(function() {
					done()
				})
			})
		})
	})

	after(function() {
		db.dropDatabase()
		db.close()
	})

	it('deletes if owner', function(done) {
		return sendGraph('toDelete')
		.then(function() {
			agent
			.delete('/'+username+'/toDelete')
			.expect(200)
			.end(function(err, res) {
				if (err)
					return done(err)

				agent
					.get('/'+username+'/toDelete')
					.expect(404)
					.end(done)
			})
		})
	})

	it('doesn`t delete if not owner', function(done) {
		return sendGraph('notDelete')
		.then(function() {
				agent
					.get('/'+username+'/notDelete')
					.expect(200)
					.end(done)
		})
	})


})

