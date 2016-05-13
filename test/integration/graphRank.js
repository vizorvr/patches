var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/graphsave'+testId
process.env.RETHINKDB_NAME = 'graphsave' + testId

var request = require('supertest')
var app = require('../../app.js')
var fs = require('fs')
var assert = require('assert')
var expect = require('chai').expect

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../../package.json'))
var currentVersion = packageJson.version.split('.').slice(0,2).join('.')

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
			agent
			.post('/signup')
			.send(deets)
			.expect(302)
			.end(done)
		})
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

				expect(res.body.data.length)
					.to.equal(1)

				expect(res.body.data[0].private)
					.to.equal(false)

				expect(res.body.data[0].name)
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

				res.body.data.map(function(graph) {
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

					res.body.data.map(function(graph) {
						assert.notEqual(graph.name, path)
					})

					done()
				})
			})
		})
	})



})

