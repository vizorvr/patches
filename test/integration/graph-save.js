
var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/graphsave'+testId
process.env.RETHINKDB_NAME = 'graphsave' + testId

var request = require('supertest')
var app = require('../../app.js')
var fs = require('fs')
var assert = require('assert')
var expect = require('chai').expect
var jpeg = __dirname+'/../fixtures/te-2rb.jpg'

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../../package.json'))
var currentVersion = packageJson.version.split('.').slice(0,2).join('.')

function rand() {
	return Math.floor(Math.random() * 10000)
}

describe('Graph', function() {
	var username
	var deets

	var agent = request.agent(app)
	var anonymousAgent = request.agent(app)

	function setAvatar(cb) {
		return agent.post('/account/profile/avatar')
				.attach('file', jpeg)
				.expect(200)
				.end(cb)
	}

	function sendGraph(path, cb) {
		return agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(cb)
	}

	function sendAnonymousGraph(path, cb) {
		return anonymousAgent.post('/graph/v').send({
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
		app.events.on('ready', done)
	})

	beforeEach(function(done) {
		username = 'user' + rand()
		deets = {
			name: 'Foo bar',
			username: username,
			email: username+'@test.foo',
			password: 'abcd1234',
			confirmPassword: 'abcd1234'
		}
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

	it('trim the space from the end', function(done) {
		var r = rand()
		var path = 'some'+r+'    '
		var goodPath = 'some'+r
		var expectedPath = '/'+username+'/'+goodPath

		sendGraph(path, function(err, res) {
			if (err) return done(err)
			var json = {
				name: res.body.name,
				owner: res.body.owner,
				url: res.body.url,
				path: res.body.path
			}
  			expect({
				name: goodPath,
				owner: username,
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

	it('should be able to give a summary', function(done) {
		var path = 'button-'+rand()

		sendGraph(path, function(err, res) {
			if (err) return done(err)
			request(app).get(res.body.path + '?summary=1')
			.expect(200).end(function(err, res) {
				if (err) return done(err)
				assert.equal(res.body.data.private, true)
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

	it('should return avatar with graph', function(done) {
		var name = 'button-'+rand()
		var path = '/'+username+'/'+name+'.json'
		var expectedPath = '/'+username+'/'+name
		var expectedAvatar = '/data/'+username+'/profile/avatar/'+(jpeg.split('/').pop().replace('.jpg', '-scaled.jpg'))
		setAvatar(function(err, res){
			if (err) return done(err)
			sendGraph(name, function(err, res) {
				if (err) return done(err)
				request(app).get(path)
				.expect(200).end(function(err, res)
				{
					if (err) return done(err)
					expect(res.body._creator.profile.avatar).to.equal(expectedAvatar)
					done()
				})
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
					.to.equal(3)
				done()
			})
		})
	})

	it('can not be found if private', function(done) {
		var path = 'graph-tag-'+process.pid

		agent.post('/graph').send({
			path: path,
			tags: [ '3948tehr' ],
			graph: graphData,
			private: true
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			anonymousAgent
			.get('/'+username)
			.set('X-Requested-With', 'XMLHttpRequest')
			.expect(200)
			.end(function(err, res) {
				var list = res.body.data.graphs.list
				if (err) return done(err)
				expect(list.length).to.equal(0)
				done()
			})
		})
	})

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
	var convertedTestPngData440x330 = "77+9UE5HDQoaCgAAAA1JSERSAAAFAAAAAu+/vQQDAAAAPVPvv71lAAAAD1BMVEUAAAAA77+9IwAh77+977+9AHvvv70IAGwmUScAAAJfSURBVHjvv73vv73vv70xAQAACAPvv73vv73vv73vv71p77+977+9P++/vUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASu+/vQbvv70EBAAAAAAAAAAA77+92LtjGgAAAAZh77+9XU/vv70M77+9VgM/AAAAAAAAAAAAAAAAAAAA77+977+9BS0CBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDvv73vv70hAQAACAMwBO+/veifigp3N1vvv70BAAAAAAAAAAAAAAAAAAAAAAAAAFDvv703EBMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO+/vdmDAwEAAAAAIO+/ve+/vUZQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRXvv73vv71AAAAAAADvv73vv73vv70RVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVXvv71dOu+/vQEABgEARjYjSO+/ve+/vToscELvv71qKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbO+/vTJgTEAAAAAAAO+/ve+/vVfvv73vv73vv70AAAAAAAAAAAAAAAAAAAAAAAAANHtwIAAAAAAA77+977+977+9CO+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/ve+/vR4cEgAAAAAI77+977+977+9GwYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABOAhvvv70Bdwvvv71weAAAAABJRU5E77+9QmDvv70="

	var convertedTestPngData1280x720 = '77+9UE5HDQoaCgAAAA1JSERSAAAFAAAAAu+/vQQDAAABSlTvv73vv70AAAAPUExURQAAAADvv70jACHvv73vv70Ae++/vQgAbCZRJwAAAiBJREFUeO+/ve+/ve+/vUsN77+9QBRFQX4C77+9BCQg77+977+977+9Yu+/ve+/ve+/vRkSbmjvv70UHANnGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA77+9aU4HAAAAAAAAAAAAAAAA77+9SEsHAAAAAO+/ve+/vXQAAM+rdAAAAAAAAAAAAAAAAAAAAAAAAO+/vWFKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDvv73vv70DAO+/vdOaDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA77+9My0dAAAAAAAAAAAAAAAAAAAAAO+/ve+/vUoHAAAAAAAAHe+/vXQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO+/vWHvv73vv70FAADvv70Z05ouAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA477+977+9dAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFfvv73vv70uAAAAAAAAAAAAAAAA77+977+977+9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO+/ve+/vR05DgHvv70a77+9K++/vQAAAABJRU5E77+9QmDvv70='

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

				assert.equal(gotData.length, expectedData.length)
				assert.equal(gotData, expectedData)

				// check small preview
				request(app).get(expectedSmallImagePath)
				.expect(200).end(function(err, res) {
					if (err) return done(err)

					var gotData = new Buffer(res.text).toString()
					var expectedData = new Buffer(convertedTestPngData440x330, 'base64').toString()

					assert.ok(gotData.length > expectedData.length - 20 &&
						gotData.length <= expectedData.length)

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


	it('sets editable flag true as default', function(done) {
		var path = 'graph-editable-'+rand()

		agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			assert.ok(res.body.editable === true)
			done()
		})
	})


	it('stores editable flag', function(done) {
		var path = 'graph-editable-'+rand()

		agent.post('/graph').send({
			path: path,
			editable: false,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			assert.ok(res.body.editable === false)
			done()
		})
	})



	it('allows editing on editable=false by owner', function(done) {
		var path = 'graph-editable-'+rand()
		var editPath = '/'+username+'/'+path+'/edit'

		agent.post('/graph').send({
			path: path,
			editable: false,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)
			
			agent.get(editPath).expect(200).end(done)
		})
	})



	it('denies editing on editable=false by other', function(done) {
		var path = 'graph-editable-'+rand()
		var editPath = '/'+username+'/'+path+'/edit'

		agent.post('/graph').send({
			path: path,
			editable: false,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)
			
			anonymousAgent.get(editPath).expect(404).end(done)
		})
	})


	it('increases graph view count on view', function(done) {
		var path = 'graph-views-'+rand()
		var viewPath = '/'+username+'/'+path+''
		var jsonPath = '/'+username+'/'+path+'.json'

		agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			assert.equal(0, res.body.views)
	
			request(app).get(viewPath).expect(200).end(function(err) {
				request(app).get(viewPath).expect(200).end(function(err) {
					if (err) return done(err)

					request(app).get(jsonPath)
					.expect(200).end(function(err, res) {
						if (err)
							return done(err)

						assert.equal(2, res.body.views)
						done()
					})
				})
			})
		})
	})

	it('increases user view count on view', function(done) {
		var path = 'graph-views-'+rand()
		var viewPath = '/'+username+'/'+path+''
		var userPath = '/'+username

		agent.post('/graph').send({
			path: path,
			graph: graphData
		})
		.expect(200)
		.end(function(err, res) {
			if (err) return done(err)

			request(app).get(viewPath).expect(200).end(function(err) {
				request(app).get(viewPath).expect(200).end(function(err) {
					if (err) return done(err)

					request(app).get(userPath)
					.set('X-Requested-With', 'XMLHttpRequest')
					.expect(200).end(function(err, res) {
						if (err)
							return done(err)

						assert.equal(2, res.body.data.profile.stats.views)
						done()
					})
				})
			})
		})
	})

	it('increases user projects count', function(done) {
		var name = 'button-'+rand()
		var userPath = '/'+username

		sendGraph(name, function(err, res) {
			if (err) return done(err)
			request(app).get(userPath)
			.set('X-Requested-With', 'XMLHttpRequest')
			.expect(200).end(function(err, res) {
				if (err) return done(err)
				expect(res.body.data.profile.stats.projects).to.equal(1)
				done()
			})
		})
	})


})

