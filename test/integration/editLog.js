var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/editLog'+testId

var EditLog = require('../../models/editLog')
var assert = require('assert')
var request = require('supertest')
var mongo = require('mongodb')

function rand() {
	return Math.floor(Math.random() * 100000)
}

var app = require('../../app.js')

describe('EditLog', function() {
	var username = 'test'+testId
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}
	
	var agent
	var db

	before(function(done) {
		app.events.on('ready', function() {
			agent = request.agent(app)
			db = new mongo.Db('editLog'+testId,
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

	it('should list user`s editlogs', function(done) {
		var channelName = 'chan'+rand()
		var readableName = 'what is this I don`t even'+rand()
		agent
		.post('/editlog/'+channelName)
		.send({
			name: channelName,
			readableName: readableName
		})
		.expect(200)
		.end(function(err) {
			if (err) return done(err);

			agent.get('/editlog')
			.end(function(err, res) {
				if (err) return done(err);

				var result = res.body;
				assert.equal(result.length, 1)
				assert.equal(result[0].participants.length, 1)
				assert.equal(result[0].readableName, readableName)
				done()
			})
		})
	})

	it('should show editlog by name', function(done) {
		var channelName = 'chan'+rand()
		var readableName = 'what is this I don`t even'+rand()
		agent
		.post('/editlog/'+channelName)
		.send({
			name: channelName,
			readableName: readableName
		})
		.expect(200)
		.end(function(err) {
			if (err) return done(err);

			agent.get('/editlog/'+channelName)
			.end(function(err, res) {
				if (err) return done(err);

				var result = res.body;
				assert.equal(result.participants.length, 1)
				assert.equal(result.readableName, readableName)
				done()
			})
		})
	})

	it('should update editlog by name', function(done) {
		var channelName = 'chan'+rand()
		var readableName = 'what is this I don`t even'+rand()
		var newName = 'longcat is long'+rand()
		agent
		.post('/editlog/'+channelName)
		.send({
			name: channelName,
			readableName: readableName
		})
		.expect(200)
		.end(function(err) {
			if (err) return done(err);

			agent.post('/editlog/'+channelName)
			.send({ readableName: newName })
			.expect(200)
			.end(function(err) {
				if (err) return done(err);
				agent.get('/editlog/'+channelName)
				.end(function(err, res) {
					if (err) return done(err);

					var result = res.body;
					assert.equal(result.readableName, newName)
					done()
				})
			})
		})
	})


	it('should be possible to join an editlog', function(done) {
		var channelName = 'chan'+rand()
		var readableName = 'what is this I don`t even'+rand()
		
		new EditLog({
			name: channelName,
			readableName: readableName,
			owner: 'foo'
		}).save(function(err) {
			if (err) return done(err);
			agent.post('/editlog/'+channelName+'/join')
			.expect(200)
			.end(function(err) {
				if (err) return done(err);
				agent.get('/editlog/'+channelName)
				.end(function(err, res) {
					if (err) return done(err);

					var result = res.body;
					assert.equal(result.participants.length, 1)
					done()
				})
			})
		})

	})


})

