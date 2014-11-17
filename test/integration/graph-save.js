var request = require('supertest');
var app = require('../../app.js');
var fs = require('fs');
var fsPath = require('path');
var assert = require('assert');

var graphFile = __dirname+'/../../browser/data/graphs/Button.json';

function rand() {
	return Math.floor(Math.random() * 10000);
}

describe('Graph', function() {
	var username = 'user'+rand();
	var deets = {
		username: username,
		email: username+'@test.foo',
		password: 'abc123',
		confirmPassword: 'abc123'
	};

	var agent = request.agent(app);

	function sendGraph(path, cb)
	{
		return agent.post('/graph').send(
		{
			path: path,
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(cb);
	}

	before(function(done)
	{
		agent
		.post('/signup')
		.send(deets)
		.expect(302)
		.end(done);
	});

	it('should use the expected name, owner, path, and url', function(done) {
		var path = 'some-'+rand();
		var expectedPath = '/'+username+'/'+path;

		sendGraph(path, function(err, res) {
			if (err) return done(err);
			var json = {
				name: res.body.name,
				owner: res.body.owner,
				url: res.body.url,
				path: res.body.path
			};
  			assert.deepEqual({
				name: path, owner: username,
				path: expectedPath,
				url: '/data/graph'+expectedPath+'.json'
			}, json);
			done();
		});
	});

	it('should return data by url', function(done) {
		var path = 'button-'+rand();

		sendGraph(path, function(err, res) {
			if (err) return done(err);
			request(app).get(res.body.url)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err);
				console.log('body', res.body)
				assert.equal(res.body.abs_t, 46.988);
				done();
			})
		});
	});

	it('should force the right path', function(done) {
		var path = '/blah/quux/bar/foo.png';
		var expectedPath = '/'+username+'/foo';

		sendGraph(path, function(err, res) {
			if (err) return done(err);
			assert.equal(res.body.path, expectedPath);
			done();
		});
	});

	it('should automatically create an optimized version', function(done) {
		var path = '/blah/quux/bar/foo.png';
		var expectedPath = '/'+username+'/foo';
		var optimPath = '/data/graph/'+username+'/foo-min.json';

		sendGraph(path, function(err, res) {
			if (err) return done(err);
			request(app).get(optimPath)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err);
				assert.equal(res.body.abs_t, 46.988);
				done();
			})
		});
	});

	it('should return graph json by path', function(done) {
		var name = 'button-'+rand();
		var path = '/'+username+'/'+name+'.json';
		var expectedPath = '/'+username+'/'+name;

		sendGraph(name, function(err, res) {
			if (err) return done(err);
			request(app).get(path)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err);
				assert.equal(res.body.path, expectedPath);
				done();
			})
		});
	});

/*	it('should return graph landing by path', function(done) {
		var path = 'button-'+rand();
		var expectedPath = '/'+username+'/'+path;

		sendGraph(path, function(err, res) {
			request(app).get(expectedPath)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err);
				assert.ok(res.body.indexOf('<body') > 0)
				done();
			})
		});
	});
*/
	it('can be found by tag after saving', function(done) {
		var path = 'graph-tag-'+process.pid;

		agent.post('/graph').send(
		{
			path: path,
			tags: [ 'tags', '#are', 'cool' ],
			graph: fs.readFileSync(graphFile)
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err);
			request(app) .get('/graph/tag/are') .expect(200)
			.end(function(err, res)
			{
				if (err) return done(err);
				assert.deepEqual(res.body[0].tags,
				[
					'#tags', '#are', '#cool'
				]);
				done(err);
			})
		});
	});

});

