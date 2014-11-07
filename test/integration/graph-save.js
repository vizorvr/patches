var request = require('supertest');
var app = require('../../app.js');
var fs = require('fs');
var fsPath = require('path');
var assert = require('assert');

var graphFile = __dirname+'/../../browser/data/graphs/Button.json';

describe('Graph', function() {
	var deets = {
		username: 'test'+process.pid,
		email: 'test'+process.pid+'@test.foo',
		password: 'abc123',
		confirmPassword: 'abc123'
	};

	var agent = request.agent(app);

	before(function(done)
	{
		agent
		.post('/signup')
		.send(deets)
		.expect(302)
		.end(done);
	});

	it('should save correctly', function(done) {
		var path = '/graph/test/path/button-'+process.pid;

		agent
		.post('/graph')
		.send(
		{
			path: path,
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(function(err, res) {
			var json = res.body;
			delete json._creator;
			delete json._id;
			delete json.createdAt;
			delete json.updatedAt;
			assert.deepEqual({"__v":0,"path":path,
				"url":'/data'+path,"tags":[]}, json);
			done(err);
		});
	});

	it('should be retrievable', function(done) {
		var path = '/graph/test/path/button-'+process.pid;

		agent
		.post('/graph')
		.send(
		{
			path: path,
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(function(err, res) {
			request(app)
			.get(res.body.url)
			.expect(200);
			done();
		});
	});

});

