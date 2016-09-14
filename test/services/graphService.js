function rand() {
	return Math.floor(Math.random() * 10000)
}
var testId = rand()
var testDb = 'graphsvc'+testId
process.env.MONGODB = 'mongodb://localhost:27017/'+testDb

var app = require('../../app.js')
var mongoose = require('mongoose')

var request = require('supertest')
var assert = require('assert')

var Graph = require('../../models/graph.js')
var GraphService = require('../../services/graphService')
var _ = require('lodash')
var fs = require('fs')

var graphFile = __dirname+'/../../browser/data/graphs/default.json'
var graphData = fs.readFileSync(graphFile).toString('utf8')

var graphFile2 = __dirname+'/../../browser/data/graphs/example.json'
var graphData2 = fs.readFileSync(graphFile2).toString('utf8')

var someFailed = false

describe('GraphService', function() {

	var agent = request.agent(app)

	function sendGraph(path, data, cb) {
		return agent.post('/graph').send({
			path: path,
			graph: data
		})
		.expect(200)
		.end(cb)
	}

	var svc

	var usernameA, usernameB
	var paging = {
		offset: 0,
		limit: 100
	}

	before(function(){
		console.log('* db is graphsvc'+testId)

		var rnd = rand()
		// must be lowercase
		usernameA = 'user' + rnd + 'a'
		usernameB = 'user' + rnd + 'b'
		var deets1 = {
			name: 'Foo bar',
			username: usernameA,
			email: usernameA+'@test.foo',
			password: 'abcd1234',
			confirmPassword: 'abcd1234'
		}
		var deets2 = {
			name: 'Qwe Baz',
			username: usernameB,
			email: usernameB+'@test.foo',
			password: 'abdea1234',
			confirmPassword: 'abdea1234'
		}

		var postAcct = function() {
			var deets = this
			return new Promise(function(resolve, reject){
				agent
					.post('/signup')
					.send(deets)
					.expect(302)
					.end(function(err, data){
						if (err)
							reject(err)
						resolve(data)
					})
			})
		}

		var postGraph = function() {
			var data = this
			return new Promise(function(resolve, reject) {
				var now = new Date().getTime()
				while (now === new Date().getTime()) {}		// wait a msec
				sendGraph(data.path, data.graph, function(err, data){
					if (err)
						reject(err)
					resolve(data)
				})
			})
		}

		return postAcct.call(deets1)
			.then(postGraph.bind({path:'/'+usernameA+'/testa1', graph: graphData}))
			.then(postGraph.bind({path:'/'+usernameA+'/testa2', graph: graphData2}))
			.then(postAcct.bind(deets2))
			.then(postGraph.bind({path:'/'+usernameB+'/testb1', graph: graphData}))
			.then(postGraph.bind({path:'/'+usernameB+'/testb2', graph: graphData2}))
			.then(function(){
				console.log('* users are ' + usernameB + ', ' + usernameB)
				return Promise.resolve()
			})
	})

	beforeEach(function(done) {
		svc = new GraphService(Graph)
		done()
	})

	afterEach(function(done) {
		if (this.currentTest.state === 'failed') {
		  someFailed = true
		}
		done()
	})

	after(function(done){
		if (someFailed)
			return done()

		mongoose.connect('mongodb://localhost:27017/'+testDb, function(){
			mongoose.connection.db.dropDatabase(function(){
				console.log('dropped test DB: ' + testDb );
				done()
			})
		})
	})


	it('finds by creator username', function() {
		return svc.findByCreatorName(usernameA)
			.then(function(data){
				assert.equal(data.length, 2)
				assert.equal(data[0].name, 'testa2')
				assert.equal(data[1].url, '/data/graph/'+usernameA+'/testa1.json')
			})
	})

	it('counts and finds graphs', function(){
		return svc.countAndFind(null, null, '_id name owner', paging)
			.then(function(data){
				var hasList = !!data.list
				var hasMeta = !!data.meta
				assert.equal(hasList, true, 'data should contain .list')
				assert.equal(hasMeta, true, 'data should contain .meta information')
				assert.equal(data.meta.totalCount, 4)
				assert.equal(data.meta.listCount, data.list.length, 'meta listCount is not the same as list length')
			})
	})


	it('attaches owners info', function(){
		return svc._listWithOwners(null, 'name,owner,_creator', null, paging)
			.then(function (data) {
				var hasOwners = !!data.owners && !_.isEmpty(data.owners)

				assert.equal(hasOwners, true, 'data has no owners?')
				assert.equal(Object.keys(data.owners).length, 2)

				var graphOwnerIds = {}
				for (var graph of data.list) {
					graphOwnerIds[graph._creator] = graph._creator
				}

				var userAfound = false
				var userBfound = false
				for (var ownerId in data.owners) {
					if (!data.owners.hasOwnProperty(ownerId))
						continue

					if (data.owners[ownerId].username === usernameA)
						userAfound = true
					if (data.owners[ownerId].username === usernameB)
						userBfound = true

					assert.equal(ownerId, graphOwnerIds[ownerId], 'owner ' + ownerId + ' must be a _creator in the list of graphs')
				}

				assert.equal(userAfound, true, 'could not find ' + usernameA + ' in returned owners')
				assert.equal(userBfound, true, 'could not find ' + usernameB + ' in returned owners')

			})
	})

})