var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/graphsave'+testId
process.env.RETHINKDB_NAME = 'graphsave' + testId

var request = require('supertest')
var app = require('../../app.js')
var fs = require('fs')
var assert = require('assert')
var expect = require('chai').expect

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../../package.json'))
var currentVersion = packageJson.version.split('.').slice(0,2).join('.')

function rand() {
	return Math.floor(Math.random() * 10000)
}

describe('Graph', function() {
	var username = 'user'+rand()
	var deets = {
		name: 'Foo bar',
		username: username,
		email: username+'@test.foo',
		password: 'abcd1234',
		confirmPassword: 'abcd1234'
	}

	var agent = request.agent(app)

	function sendGraph(path, cb) {
		return agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(cb)
	}

	function sendAnonymousGraph(path, cb) {
		return agent.post('/graph/v').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(cb)
	}

	function findAutoplayInHTML(bodyHtml) {
		var canvasRX 	= /<canvas\/?[\w\s="/.':;#-\/]+>[.\s\S]*<\/canvas>/gi.exec(bodyHtml)
		var endScriptRX	= /<script>[.\s\S]*<\/script>/gi.exec(bodyHtml)
		return {
			canvasTag: 		canvasRX.length === 1 	? canvasRX[0] 	: '',
			endScriptTag: 	endScriptRX.length > 0 	? endScriptRX.pop()	: ''
		}
	}

	before(function(done) {
		agent
		.post('/signup')
		.send(deets)
		.expect(302)
		.end(done)
	})

	it('should accept anonymous save', function(done) {
		var path = 'some-'+rand()
		var expectedPath = '/v/'+path

		sendAnonymousGraph(path, function(err, res) {
			if (err) return done(err)
			var json = {
				name: res.body.name,
				owner: res.body.owner,
				url: res.body.url,
				path: res.body.path
			}
			expect(json.name).to.not.equal(path)
			expect(json.owner).to.equal('v')
			expect(json.path).to.equal('/v/'+json.name)
			expect(json.url).to.equal('/data/graph/v/'+json.name+'.json')
			done()
		})
	})

	it('should use the expected name, owner, path, and url', function(done) {
		var path = 'some-'+rand()
		var expectedPath = '/'+username+'/'+path

		sendGraph(path, function(err, res) {
			if (err) return done(err)
			var json = {
				name: res.body.name,
				owner: res.body.owner,
				url: res.body.url,
				path: res.body.path
			}
  			expect({
				name: path, owner: username,
				path: expectedPath,
				url: '/data/graph'+expectedPath+'.json'
			}).to.deep.equal(json)
			done()
		})
	})

	it('should return data by url', function(done) {
		var path = 'button-'+rand()

		sendGraph(path, function(err, res) {
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
		var expectedPath = '/'+username+'/foo'

		sendGraph(path, function(err, res) {
			if (err) return done(err)
			expect(res.body.path).to.equal(expectedPath)
			done()
		})
	})

	it('should automatically create an optimized version', function(done) {
		var name = rand()
		var path = '/blah/quux/bar/'+name+'.png'
		var expectedPath = '/'+username+'/foo'
		var optimPath = '/data/graph/'+username+'/'+name+'.min.json'
		sendGraph(path, function(err, res) {
			if (err) return done(err)
			request(app).get(optimPath)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err)
				assert.equal(res.body.active_graph, 'root')
				done()
			})
		})
	})

	it('should return graph json by path', function(done) {
		var name = 'button-'+rand()
		var path = '/'+username+'/'+name+'.json'
		var expectedPath = '/'+username+'/'+name

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(path)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err)
				expect(res.body.path).to.equal(expectedPath)
				done()
			})
		})
	})

	it('should save graph version', function(done) {
		var name = 'button-'+rand()
		var path = '/'+username+'/'+name+'.json'

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(path)
			.expect(200).end(function(err, res) {
				if (err) return done(err)
				expect(res.body.version).to.equal(currentVersion)
				done()
			})
		})
	})

	it('should use the player version for the graph', function(done) {
		var name = 'button-'+rand()
		var path = '/'+username+'/'+name

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(path)
			.set('Accept', 'text/html')
			.expect(200).end(function(err, res) {
				if (err) return done(err)

				expect(res.text
					.split('/'+currentVersion+'/player.min.js').length)
					.to.equal(2)

				done()
			})
		})
	})


	it('should autoplay graphs by default', function(done) {
		var name = 'button-'+rand()
		var path = '/'+username+'/'+name

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(path)
			.set('Accept', 'text/html')
			.expect(200).end(function(err, res) {
				if (err) return done(err)
				var autoplay = findAutoplayInHTML(res.text)
				expect(autoplay.canvasTag
					.split('data-autoplay="true"').length)
					.to.equal(2)

				expect(autoplay.endScriptTag
					.split('Vizor.autoplay = true').length)
					.to.equal(2)
				done()
			})
		})
	})

	it('should not autoplay embedded graphs', function(done) {
		var name = 'button-'+rand()
		var path = '/embed/'+username+'/'+name

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(path)
			.set('Accept', 'text/html')
			.expect(200).end(function(err, res) {
				if (err) return done(err)
				var autoplay = findAutoplayInHTML(res.text)
				expect(autoplay.canvasTag
					.split('data-autoplay="true"').length)
					.to.equal(1)

				expect(autoplay.endScriptTag
					.split('Vizor.autoplay = false').length)
					.to.equal(2)
				done()
			})
		})
	})

/*	it('should return graph landing by path', function(done) {
		var path = 'button-'+rand()
		var expectedPath = '/'+username+'/'+path

		sendGraph(path, function(err, res) {
			request(app).get(expectedPath)
			.expect(200).end(function(err, res)
			{
				if (err) return done(err)
				assert.ok(res.body.indexOf('<body') > 0)
				done()
			})
		})
	})
*/
	it('can be found by tag after saving', function(done) {
		var path = 'graph-tag-'+process.pid

		agent.post('/graph').send({
			path: path,
			tags: [ 'tags', '#are', 'cool' ],
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			request(app)
			.get('/'+username+'/assets/graph/tag/are')
			.expect(200)
			.end(function(err, res) {
				if (err)
					return done(err)

				expect(res.body[0].tags)
				.to.deep.equal([
					'tags', 'are', 'cool'
				])
				done(err)
			})
		})
	})

	// original data
	var testPngData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAALQ" +
	"BAMAAAA9U8BlAAAAD1BMVEUAAAAAiSMAIYmJAHuJCABsJlEnAAACX0lEQVR42uzSMQEAAAgD" +
	"oNnA/mmt4D/IQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAABKzQbeBAQAAAAAAAAAAODYu2MaAAAABmH+XU/BDJBWAz8AAAAAAAAAAAAAAAAAAACH" +
	"tQUtAgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABg7NIhAQAA" +
	"CAMwBMHon4oKdzdbhgEAAAAAAAAAAAAAAAAAAAAAAAAAULE3EBMQAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAODZgwMBAAAAACD/10ZQVVVVVVVVVVVVVVVVVVVVVVVV" +
	"VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRX24EAAAAAAAMj/tRFU" +
	"VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV" +
	"VVVVVYVdOqYBAAYBAEY2I0jAvzoscELSaigAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAGz3MmBMQAAAAAAAuOdXwJiAAAAAAAAAAAAAAAAAAAAAAAAAADR7cCAAAAAAAOT/2giq" +
	"qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
	"qqqqqtIeHBIAAAAACPr/2hsGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATgIb" +
	"gAF3C+ZweAAAAABJRU5ErkJggg=="

	// converted data
	var convertedTestPngData440x330 = "iVBORw0KGgoAAAANSUhEUgAAAbgAAAFKCAIAAA" +
	"Dg8t32AAAACW9GRnMAAABJAAAAAADyfe1qAAACSElEQVR42u3cMWoDMRRF0SdpDJ6BmBC8CJ" +
	"cmTZrsf0cpw6RKZ3eGrzjnrOAipA9SoQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAA/rBRHQBw15rjnn3PXpvRq9cB4Lae/pmPt7xWhwBMbM1xuP" +
	"gCAABT6Vu2i6dneCwn6rm0kXFKa9UdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWW5NzSqzOYhJ0AN6wt7y" +
	"NLq+4AmNmoDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAD+oVEdADyjy5be8vVd3fEYvToAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmN" +
	"Gh5XxIq84A5uOH81+nJdeXdJMS4J6WDFMSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAHuUHbOoIJX3zO+IAAAAASUVORK5CYII="

	var convertedTestPngData1280x720 = "iVBORw0KGgoAAAANSUhEUgAABQAAAALQBAMAA" +
	"AA9U8BlAAAAD1BMVEUAAAAAiSMAIYmJAHuJCABsJlEnAAACBklEQVR42u3dSQ3AMBRDwXQBU" +
	"AiFEAjljyoEcqsiK/ozCHx4d7cGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO7p6egGlCRAAAAAAYJnzTS+gNAECAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAADwy/2lF1CaAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICFjie9gNIECAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAW3I5QJQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
	"AAAAAAAAAAAAAAAAJgYs2sBd9eN6WAAAAAASUVORK5CYII="

	it('uploads preview images', function(done) {
		var path = 'graph-with-preview-image-good-'+process.pid
		var expectedSmallImagePath = '/data/previews/' + username + '/' + path + '-preview-440x330.png'
		var expectedLargeImagePath = '/data/previews/' + username + '/' + path + '-preview-1280x720.png'
		var expectedOriginalImagePath = '/data/previews/' + username + '/' + path + '-preview-original.png'

		agent.post('/graph').send({
			path: path,
			graph: graphData,
			previewImage: testPngData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			// check original image
			request(app).get(expectedOriginalImagePath)
			.expect(200).end(function(err, res)	{
				if (err) return done(err)

				var gotData = new Buffer(res.text).toString()
				var expectedData = new Buffer(testPngData.replace(/^data:image\/\w+;base64,/, ""), 'base64').toString()

				assert.equal(gotData, expectedData)

				// check small preview
				request(app).get(expectedSmallImagePath)
				.expect(200).end(function(err, res)
				{
					if (err) return done(err)

					var gotData = new Buffer(res.text).toString()
					var expectedData = new Buffer(convertedTestPngData440x330, 'base64').toString()

					assert.equal(gotData, expectedData)

					// check large preview
					request(app).get(expectedLargeImagePath)
					.expect(200).end(function(err, res)
					{
						if (err) return done(err)

						var gotData = new Buffer(res.text).toString()
						var expectedData = new Buffer(convertedTestPngData1280x720, 'base64').toString()

						assert.equal(gotData, expectedData)

						done()
					})
				})

			})

		})
	})

	it('creates no image on null preview data', function(done) {
		var path = 'graph-with-preview-image-null-'+process.pid
		var expectedImagePath = '/data/previews/' + username + '/' + path + '-preview-440x330.png'

		agent.post('/graph').send({
			path: path,
			graph: graphData,
			previewImage: null
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			request(app).get(expectedImagePath)
			.expect(404).end(function(err, res)
			{
				if (err) return done(err)

				done()
			})
		})
	})

	it('creates no image on invalid preview data', function(done) {
		var path = 'graph-with-preview-image-invalid-'+process.pid
		var expectedImagePath = '/data/previews/' + username + '/' + path + '-preview.png'

		agent.post('/graph').send({
			path: path,
			graph: graphData,
			previewImage: "abcdefg123456789"
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			request(app).get(expectedImagePath)
			.expect(404).end(function(err, res)
			{
				if (err) return done(err)

				done()
			})
		})
	})


})

