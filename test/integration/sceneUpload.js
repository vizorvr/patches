var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/sceneUpload'+testId

var request = require('supertest')
var fs = require('fs')
var fsPath = require('path')
var mongo = require('mongodb')
var assert = require('assert')

function rand() {
	return Math.floor(Math.random() * 100000)
}

var app = require('../../app.js')

describe('Upload', function() {
	var username = 'test'+testId
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}
	
	function makePath(model, name) {
		return '/' + fsPath.join(deets.username, 'assets', model, name)
	}

	var agent = request.agent(app)
	var db

	after(function() {
		db.dropDatabase()
		db.close()
	})

	before(function(done) {
		app.events.on('ready', function() {
			var that = this

			db = new mongo.Db('upload'+testId,
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

	it('remaps OBJ+MTL+TGA', function(done) {
		var scene = makePath('scene', 'lambent-obj-mtl-tga')
		var original = scene+'.zip'
		var stream = fs.createReadStream(__dirname+'/../fixtures/lambent-obj-mtl-tga.zip')
		stream.path = original

		agent
		.post('/upload/scene')
		.attach('file', stream, original)
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)
			var json = res.body
			delete json._creator
			delete json._id
			delete json.id
			delete json.createdAt
			delete json.updatedAt
			json.files = json.files.sort()

			files = [
				'/data'+scene+'/attribution.txt',
				'/data'+scene+'/lambent-obj-mtl-tga.obj',
				'/data'+scene+'/lambent-obj-mtl-tga.mtl',
				'/data'+scene+'/Lambent_Male_D.png',
				'/data'+scene+'/Lambent_Male_N.png',
				'/data'+scene+'/Lambent_Male_S.png'
				].sort()

			assert.deepEqual({__v: 0,
				path: scene,
				name: 'lambent-obj-mtl-tga',
				url: '/data'+scene+'/lambent-obj-mtl-tga.obj',
				tags: [],
				type: 'objmtl',
				files: files
			}, json)

			agent.get('/data'+scene+'/lambent-obj-mtl-tga.mtl')
			.end(function(err, res) {
				if (err)
					return done(err)

				assert.equal('map_Kd Lambent_Male_D.png', res.text.split('\n')[11])

				done(err)
			})
		})
	})


	it('supports json', function(done) {
		var scene = makePath('scene', 'teapot-claraio')
		var original = scene+'.json'
		var stream = fs.createReadStream(__dirname+'/../fixtures/teapot-claraio.json')
		stream.path = original

		agent
		.post('/upload/scene')
		.attach('file', stream, original)
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)
			var json = res.body
			delete json._creator
			delete json._id
			delete json.id
			delete json.createdAt
			delete json.updatedAt

			var files = [
				'/data'+scene+'/teapot-claraio.json'
			]

			assert.deepEqual({__v: 0,
				path: scene+'/teapot-claraio.json',
				name: 'teapot-claraio.json',
				url: '/data'+scene+'/teapot-claraio.json',
				tags: [],
				type: 'json',
				files: files
			}, json)

			done()
		})
	})


	it('supports gltf', function(done) {
		var scene = makePath('scene', 'cesium-man-three-gltf')
		var original = scene+'.zip'
		var stream = fs.createReadStream(__dirname+'/../fixtures/cesium-man-three-gltf.zip')
		stream.path = original

		agent
		.post('/upload/scene')
		.attach('file', stream, original)
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)
			var json = res.body
			json.files = json.files.sort()
			delete json._creator
			delete json._id
			delete json.id
			delete json.createdAt
			delete json.updatedAt

			var files = [
				'/data'+scene+'/cesium-man-three-gltf.gltf',
				'/data'+scene+'/Cesium_Man.jpg',
				'/data'+scene+'/Cesium_Man.bin',
				'/data'+scene+'/Cesium_Man0FS.glsl',
				'/data'+scene+'/Cesium_Man0VS.glsl',
			].sort()

			assert.deepEqual({__v: 0,
				path: scene,
				name: 'cesium-man-three-gltf',
				url: '/data'+scene+'/cesium-man-three-gltf.gltf',
				tags: [],
				type: 'gltf',
				files: files
			}, json)

			done()
		})
	})

})

