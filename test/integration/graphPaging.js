var testId = rand()
var DBNAME = 'paging'+testId

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

describe('Graph paging', function() {
	var username = 'user'+rand()
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}

	var agent
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
			agent = request.agent(app)

			db = new mongo.Db(DBNAME,
				new mongo.Server('localhost', 27017),
				{ safe: true }
			)

			db.open(function() {
				agent
				.post('/signup')
				.send(deets)
				.expect(302)
				.end(function(err) {
					when.map(range(10), guard(guard.n(1), function(i) {
						return sendGraph('dummy'+i)
					}))
					.then(function() {
						done()
					})
				})
			})
		})

	})

	after(function() {
		db.dropDatabase()
		db.close()
	})

	it('pages on browse', function(done) {
		request(app)
		.get('/browse')
		.set('X-Requested-With', 'XMLHttpRequest')
		.expect(200)
		.end(function(err, res) {
			if (err)
				return done(err)

			assert.equal(3, res.body.data.result.length)
			assert.equal(1, res.body.data.meta.page)
			assert.equal(4, res.body.data.meta.pages)
			assert.equal(10, res.body.data.meta.totalCount)

			assert.equal('dummy9', res.body.data.result[0].name)

			done()
		})
	})

	it('pages on browse page 2', function(done) {
		request(app)
		.get('/browse/page/2')
		.set('X-Requested-With', 'XMLHttpRequest')
		.expect(200)
		.end(function(err, res) {
			if (err)
				return done(err)

			assert.equal(3, res.body.data.result.length)
			assert.equal(2, res.body.data.meta.page)
			assert.equal(4, res.body.data.meta.pages)
			assert.equal(10, res.body.data.meta.totalCount)

			assert.equal('dummy6', res.body.data.result[0].name)

			done()
		})
	})

	it('pages on user page 3', function(done) {
		request(app)
		.get('/'+username+'/page/3')
		.set('X-Requested-With', 'XMLHttpRequest')
		.expect(200)
		.end(function(err, res) {
			if (err)
				return done(err)

			assert.equal(3, res.body.data.result.length)
			assert.equal(3, res.body.data.meta.page)
			assert.equal(4, res.body.data.meta.pages)
			assert.equal(10, res.body.data.meta.totalCount)

			assert.equal('dummy3', res.body.data.result[0].name)

			done()
		})
	})


})

