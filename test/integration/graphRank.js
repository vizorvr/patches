var testId = rand()
var DBNAME = 'graphrank'+testId
process.env.MONGODB = 'mongodb://localhost:27017/'+DBNAME

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

function rand() {
	return Math.floor(Math.random() * 10000)
}

describe('Graph', function() {
	var username = 'user'+rand()
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}

	var agent = request.agent(app)
	var db

	function sendGraph(path, cb) {
		return agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(cb)
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
				.end(done)
			})
		})
	})

	after(function() {
		db.dropDatabase()
		db.close()
	})

	it('displays public', function(done) {
		var path = 'graph-rank-'+rand()

		agent.post('/graph').send({
			path: path,
			graph: graphData,
			isPublic: true
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			assert.equal(res.body.private, false)

			request(app)
			.get('/browse')
			.set('X-Requested-With', 'XMLHttpRequest')
			.expect(200)
			.end(function(err, res) {
				if (err)
					return done(err)

				var list = res.body.data.list

				expect(list.length)
					.to.equal(1)

				expect(list[0].private)
					.to.equal(false)

				expect(list[0].name)
					.to.equal(path)

				done()
			})
		})
	})

	it('doesn\'t display privates', function(done) {
		var path = 'graph-rank-'+rand()

		agent.post('/graph').send({
			path: path,
			isPublic: false,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			assert.equal(res.body.private, true)

			request(app)
			.get('/browse')
			.set('X-Requested-With', 'XMLHttpRequest')
			.expect(200)
			.end(function(err, res) {
				if (err)
					return done(err)

				res.body.data.list.map(function(graph) {
					assert.notEqual(graph.name, path)
				})

				done()
			})
		})
	})

	it('doesn\'t display deleted', function(done) {
		var path = 'graph-rank-'+rand()

		agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			agent.delete('/'+username+'/'+path)
			.expect(200)
			.end(function(err, res) {
				if (err)
					return done(err)

				request(app)
				.get('/browse')
				.set('X-Requested-With', 'XMLHttpRequest')
				.expect(200)
				.end(function(err, res) {
					if (err)
						return done(err)

					res.body.data.list.map(function(graph) {
						assert.notEqual(graph.name, path)
					})

					done()
				})
			})
		})
	})



})

