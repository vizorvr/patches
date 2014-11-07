var request = require('supertest');
var app = require('../../app.js');
var fs = require('fs');
var fsPath = require('path');
var assert = require('assert');

describe('Upload', function() {
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

	describe('Image', function()
	{
		it('should upload correctly', function(done) {
			var original = '/image/'+process.pid+'.jpg';
			var thumb = '/image/'+process.pid+'-thumb.jpg'
			var scaled = '/image/'+process.pid+'-scaled.jpg'
			var scaledThumb = '/image/'+process.pid+'-scaled-thumb.jpg'
			var stream = fs.createReadStream(__dirname+'/../fixtures/te-2rb.jpg');
			stream.path = original

			agent
			.post('/upload/image')
			.attach('file', stream, original)
			.expect(200)
			.end(function(err, res) {
				var json = res.body;
				delete json._creator;
				delete json._id;
				delete json.createdAt;
				delete json.updatedAt;
				delete json.scaledThumbnail.bytes;
				delete json.scaled.bytes;
				delete json.thumbnail.bytes;
				assert.deepEqual({__v:0,path:original,url:'/data'+original,tags:[],
					scaledThumbnail:{mimetype:'image/jpeg',width:128,height:128,path:scaledThumb,url:'/data'+scaledThumb},
					scaled:{mimetype:'image/jpeg',width:1024,height:1024,path:scaled,url:'/data'+scaled},
					thumbnail:{mimetype:'image/jpeg',width:128,height:72,path:thumb,url:'/data'+thumb},
					original:{bytes:95755,mimetype:'image/jpeg',width:1920,height:1080,path:original,url:'/data'+original}}, json);
				done(err);
			});
		});
	});

	describe('Scene', function()
	{
		it('should return 200 OK', function(done) {
			var scene = '/scene/'+process.pid;
			var original = scene+'.zip';
			var stream = fs.createReadStream(__dirname+'/../fixtures/scene.zip');
			stream.path = original

			agent
			.post('/upload/scene')
			.attach('file', stream, original)
			.expect(200)
			.end(function(err, res) {
				var json = res.body;
				delete json._creator;
				delete json._id;
				delete json.createdAt;
				delete json.updatedAt;

				files = [ scene+'/attribution.txt',
					scene+'/scene.json',
					scene+'/scene_Cube_n0.png',
					scene+'/scene_Cube_t00.png',
					scene+'/scene_Cube_v0.png',
					scene+'/skybox_1.jpg',
					scene+'/skybox_2.jpg',
					scene+'/skybox_3.jpg',
					scene+'/skybox_not.jpg' ]

				assert.deepEqual({"__v":0,"path":scene,"url":'/data'+scene+'/scene.json',"tags":[],
					files: files
				}, json);
				done(err);
			});
		});
	});

	describe('Audio', function()
	{
		it('should return 200 OK', function(done) {
			var audio = '/audio/'+process.pid+'.ogg';
			var stream = fs.createReadStream(__dirname+'/../../browser/data/audio/inedible_candy.ogg');
			stream.path = audio

			agent
			.post('/upload/audio')
			.attach('file', stream, audio)
			.expect(200)
			.end(function(err, res) {
				var json = res.body;
				delete json._creator;
				delete json._id;
				delete json.createdAt;
				delete json.updatedAt;

				assert.deepEqual({"__v":0,"path":audio,"url":"/data"+audio,"tags":[]}, json);
				done(err);
			});
		});
	});

	describe('JSON', function()
	{
		it('should return 200 OK', function(done) {
			var jsonFile = '/json/'+process.pid+'.json';
			var stream = fs.createReadStream(__dirname+'/../../browser/data/graphs/audrey2.json');
			stream.path = jsonFile

			agent
			.post('/upload/json')
			.attach('file', stream, jsonFile)
			.expect(200)
			.end(function(err, res) {
				var json = res.body;
				delete json._creator;
				delete json._id;
				delete json.createdAt;
				delete json.updatedAt;

				assert.deepEqual({"__v":0,"path":jsonFile,"url":"/data"+jsonFile,"tags":[]}, json);
				done(err);
			});
		});
	});

});

