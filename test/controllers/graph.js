var assert = require('assert');
var GraphController = require('../../controllers/graphController');
var when = require('when');
var fs = require('fs')

describe('GraphController', function() {
	var ctrl, svc, stream
	var res = { json: function() {} }

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
				assert.equal(json.url, '/root/graph/memyselfandi/foo.json')
				assert.equal(json.previewUrlSmall, '/root/previews/memyselfandi/foo-preview-440x330.png')
				assert.equal(json.previewUrlLarge, '/root/previews/memyselfandi/foo-preview-1280x720.png')
				done()
			}
		}, done)
	});

});

