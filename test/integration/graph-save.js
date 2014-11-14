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

	it('should save correctly with full path', function(done) {
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
			if (err) return done(err);
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

	it('should save correctly given only name', function(done) {
		var path = 'some-'+process.pid;

		agent
		.post('/graph')
		.send(
		{
			path: path,
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err);
			var json = res.body;
			delete json._creator;
			delete json._id;
			delete json.createdAt;
			delete json.updatedAt;
			assert.deepEqual({"__v":0,"path":'/graph/'+path,
				"url":'/data/graph/'+path,"tags":[]}, json);
			done(err);
		});
	});

	it('should be retrievable', function(done) {
		var path = '/graph/test/path/button-rand-'+Math.floor(Math.random() * 1000);

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
			.expect(200)
			.end(function(err, res)
			{
				if (err) return done(err);
				assert.equal(res.body.abs_t, 46.988);
				done();
			})
		});
	});

	it('should be retrievable after saving with only name', function(done) {
		var path = 'some-retr-'+process.pid;

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
			.expect(200)
			.end(function(err, res)
			{
				if (err) return done(err);
				assert.equal(res.body.abs_t, 46.988);
				done(err);
			})
		});
	});

	it('can be found by tag after saving', function(done) {
		var path = 'graph-tag-'+process.pid;

		agent
		.post('/graph')
		.send(
		{
			path: path,
			tags: ['tags', '#are', 'cool'],
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(function(err, res) {
			request(app)
			.get('/graph/tag/are')
			.expect(200)
			.end(function(err, res)
			{
				assert.deepEqual(res.body[0].tags,
				[
					'#tags', '#are', '#cool'
				]);
				done(err);
			})
		});
	});

});

