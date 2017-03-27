process.env.GRAPHCONTROLLER_PAGE_SIZE = 2

var assert = require('assert')
var GraphController = require('../../controllers/graphController')
var when = require('when')
var fs = require('fs')

describe('GraphController', function() {
	var ctrl, svc, stream
	var res = { json: function() {}, render: function() {} }

	function resolved(data) {
		return when.resolve(data)
	}

	beforeEach(function() {
		svc = {
			canWrite: resolved,
			save: function(data) {
				return resolved(data)
			}
		}
		fs = {
			url: function(str) {
				return '/root'+str
			},
			writeString: function() {
				return resolved()
			},
			writeString: resolved
		}

		var mongo = {
			collection: function() {}
		}
		ctrl = new GraphController(svc, fs, mongo)
	})

	it('calls save on graph post', function(done) {
		svc.save = function(data) {
			assert.equal(data.path, '/memyselfandi/foo')
			assert.equal(data.graph, undefined)
			return resolved(data)
		}

		fs.writeString = function() {
			done()
			return resolved()
		}

		ctrl.save({
			body: { path: 'foo', graph: '{ "root": {}}' },
			user: { username: 'memyselfandi' }
		}, res, done)
	});

	it('handles graph post', function(done) {
		ctrl.save({
			body: { path: 'foo', graph: '{ "root": {}}' },
			user: { username: 'memyselfandi'}
		}, {
			json: function(json) {
				assert.equal(json.path, '/memyselfandi/foo')
				assert.equal(json.url.indexOf('/root/graph/memyselfandi/foo'), 0)
				assert.equal(json.previewUrlSmall, '/root/previews/memyselfandi/foo-preview-440x330-52ee467b8878a91cce01ab0f2a3e8ff849909ba5.png')
				assert.equal(json.previewUrlLarge, '/root/previews/memyselfandi/foo-preview-1280x720-52ee467b8878a91cce01ab0f2a3e8ff849909ba5.png')
				done()
			}
		}, done)
	});

	it('pages through results 0-1', function(done) {
		svc.publicRankedList = function(opts) {
			assert.equal(opts.limit, 2)
			assert.equal(opts.offset, 0)
			done()
			return when.resolve({ result: [] })
		}
		ctrl.publicRankedIndex({ params: { page: 0 }, }, res, done)
	});

	it('pages through results 2-3', function(done) {
		svc.publicRankedList = function(opts) {
			assert.equal(opts.limit, 2)
			assert.equal(opts.offset, 2)
			done()
			return when.resolve({ result: [] })
		}
		ctrl.publicRankedIndex({ params: { page: 2 }, }, res, done)
	});

});
