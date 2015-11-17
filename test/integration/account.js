var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/upload'+testId
process.env.RETHINKDB_NAME = 'upload' + testId

var request = require('supertest');
var fs = require('fs');
var fsPath = require('path');
var mongo = require('mongodb');
var expect = require('chai').expect;

function rand() {
	return Math.floor(Math.random() * 100000);
}

var app = require('../../app.js');

describe('Account', function() {
	var username = 'test'+testId;
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	};
	
	function makePath(model, name) {
		return '/' + fsPath.join(deets.username, 'assets', model, name)
	}

	var agent = request.agent(app);
	var db;

	before(function(done) {
		var that = this;

		db = new mongo.Db('upload'+testId,
			new mongo.Server('localhost', 27017),
			{ safe: true }
		);

		db.open(function() {
			agent
			.post('/signup')
			.send(deets)
			.expect(302)
			.end(done);
		})
	})

	after(function() {
		db.dropDatabase();
	});

	it('should return 200 for non-existing email check', function(done) {
		agent
		.post('/account/email/exists')
		.send({ 'email': 'foo@bar.com' })
		.expect(200)
		.end(done)
	});

	it('should return 409 for existing email check', function(done) {
		agent
		.post('/account/email/exists')
		.send({ 'email': deets.email })
		.expect(409)
		.end(done)
	});

});

