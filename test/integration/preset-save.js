var testId = rand()
var DBNAME = 'presetsave'+testId
process.env.MONGODB = 'mongodb://localhost:27017/'+DBNAME

var Preset = require('../../models/preset')
var request = require('supertest')
var app = require('../../app.js')
var fs = require('fs')
var fsPath = require('path')
var assert = require('assert')
var expect = require('chai').expect

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile)

var mongo = require('mongodb')

function rand() {
	return Math.floor(Math.random() * 10000)
}

describe('Preset', function() {
	var username = 'user'+rand()
	var deets = {
		name: 'Foo Bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}

	var agent = request.agent(app)
	var db

	function sendPreset(name, cb) {
		return agent.post('/'+deets.username+'/presets').send({
			name: name,
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

	it('should use the expected name, owner, path, and url', function(done) {
		var name = 'This is a preset'
		var expectedPath = '/'+username+'/'+'this-is-a-preset.json'

		sendPreset(name, function(err, res) {
			if (err) return done(err)
			var json = {
				name: res.body.name,
				url: res.body.url,
				path: res.body.path
			}
  			expect({
				name: name,
				path: expectedPath,
				url: '/data/preset'+expectedPath
			}).to.deep.equal(json)
			done()
		})
	})

	it('should return data by url', function(done) {
		var path = 'button-'+rand()

		sendPreset(path, function(err, res) {
			if (err) return done(err)
			request(app).get(res.body.url)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err)
				assert.equal(res.body.active_graph, 'root')
				done()
			})
		})
	})

	it('should force the right path', function(done) {
		var path = '/blah/quux/bar/foo.png'
		var expectedPath = '/'+username+'/foo.json'

		sendPreset(path, function(err, res) {
			if (err) return done(err)
			expect(res.body.path).to.equal(expectedPath)
			done()
		})
	})

	it('should list user presets', function(done) {
		Preset.remove().exec(function(err) {
			if (err) return done(err)

			sendPreset('Awesomesauce Preset', function(err, res) {
				if (err) return done(err)
				request(app)
				.get('/'+username+'/presets')
				.expect(200).end(function(err, res)
				{
					if (err) return done(err)
					expect(res.body.length).to.equal(1)
					expect(res.body[0].name).to.equal('Awesomesauce Preset')
					done()
				})
			})
		})
	})
})

