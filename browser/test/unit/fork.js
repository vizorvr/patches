var ForkCommand = require('../../scripts/commands/fork').ForkCommand
var when = require('when')
var assert = require('assert')

function MockApp(path) {
	var that = this
	this.channelSent = []
	this.dispatches = []
	this.path = path
	this.dispatcher = {
		dispatch: function(d) {
			that.dispatches.push(d)
		}
	}
	this.setupEditorChannel = function() {
		var dfd = when.defer()
		dfd.resolve()
		return dfd.promise
	}
	this.channel = {
		send: function(e) {
			that.channelSent.push(e)
		}
	}
}	

describe('ForkCommand', function() {
	var dateNow = Date.now()

	beforeEach(function() {
		global.history = { pushState: function() {} }
		global.E2 = {
			core: {
				root_graph: {
					uid: 'root',
					nodes: [ 'a' ],
					connections: [ 'b' ]
				},
				serialise: function() {
					return 'serialisedGraph'
				}
			},
			uid: function() { return dateNow },
			app: new MockApp('owner/test')
		}

		global.E2.core.active_graph = E2.core.root_graph

	})

	it('returns', function(done) {
		var fc = new ForkCommand()
		fc.fork()
			.then(done)
			.catch(done)
	})

	it('sets the app path / channel name', function(done) {
		var fc = new ForkCommand()
		fc.fork()
			.then(function() {
				assert.equal(E2.app.path, 'owner-test-'+dateNow)
				done()
			})
			.catch(done)
	})

	it('pushes history state', function(done) {
		history.pushState = function(_st, _, path) {
			assert.equal(path, '/owner-test-'+dateNow)
			done()
		}
		var fc = new ForkCommand()
		fc.fork()
			.catch(done)
	})

	it('connects the channel', function(done) {
		E2.app.setupEditorChannel = function() {
			var dfd = when.defer()
			dfd.resolve()
			done()
			return dfd.promise
		}

		var fc = new ForkCommand()
		fc.fork().catch(done)
	})

	it('dispatches the snapshot', function(done) {
		var fc = new ForkCommand()
		fc.fork()
			.then(function() {
				var dis = E2.app.dispatches[0]
				assert.equal(dis.actionType, 'graphSnapshotted')
				assert.deepEqual(dis.data, 'serialisedGraph')
				done()
			})
			.catch(done)
	})

	it('logs the edit', function(done) {
		var editAction = { actionType: 'fooEditMade' }
		var fc = new ForkCommand()
		fc.fork(editAction)
			.then(function() {
				var sent = E2.app.channelSent[0]
				assert.equal(sent.actionType, 'fooEditMade')
				done()
			})
			.catch(done)
	})

	it('can fork a fork', function(done) {
		E2.app.path = 'someuser-graph-fork52'
		var fc = new ForkCommand()
		fc.fork()
			.then(function() {
				assert.equal(E2.app.path, 'someuser-graph-'+dateNow)
				done()
			})
			.catch(done)
	})

	it('can fork an anonymous session', function(done) {
		E2.app.path = 'beef'
		var fc = new ForkCommand()
		fc.fork()
			.then(function() {
				assert.equal(E2.app.path, 'beef-'+dateNow)
				done()
			})
			.catch(done)
	})



})



