var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/upload'+testId
process.env.RETHINKDB_NAME = 'upload' + testId

var request = require('supertest');
var fs = require('fs');
var fsPath = require('path');
var mongo = require('mongodb');
var expect = require('chai').expect;

function rand()
{
	return Math.floor(Math.random() * 100000);
}

var app = require('../../app.js');

describe('Upload', function() {
	var username = 'v'
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
		)

		db.open(done);
	})

	after(function() {
		db.dropDatabase();
	})

	/*
	before(function(done) {
		agent
		.post('/signup')
		.send(deets)
		.expect(302)
		.end(done);
	});
	*/

	describe('Image', function()
	{
		it('should upload correctly', function(done) {
			var original = makePath('image', testId+'.png')
			var thumb = makePath('image', testId+'-thumb.png')
			var scaled = makePath('image', testId+'-scaled.png')
			var scaledThumb = makePath('image', testId+'-scaled-thumb.png')
			var stream = fs.createReadStream(__dirname+'/../fixtures/te-2rb.jpg');
			stream.path = original

			agent
			.post('/uploadAnonymous/image')
			.attach('file', stream, original)
			.expect(200)
			.end(function(err, res) {
				if (err) return done(err);
				var json = res.body;
				delete json._creator;
				delete json._id;
				delete json.createdAt;
				delete json.updatedAt;
				delete json.original.bytes;
				delete json.scaledThumbnail.bytes;
				delete json.scaled.bytes;
				delete json.thumbnail.bytes;

				expect(json.url.length).to.equal(56);
				expect(json.original.url.length).to.equal(56);
				expect(json.scaled.url.length).to.equal(56);
				expect(json.scaledThumbnail.url.length).to.equal(56);
				expect(json.thumbnail.url.length).to.equal(56);

				done(err);
			});
		});
	});
	
});

