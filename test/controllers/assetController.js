var mongoose = require('mongoose')
var assert = require('assert');
var AssetController = require('../../controllers/assetController');
var when = require('when');

describe('AssetController', function() {
	var ctrl, svc;
	var resolved = function(data) {
		var dfd = when.defer();
		dfd.resolve(data || true);
		return dfd.promise;
	};

	beforeEach(function() {
		var fs;
		svc = {}
		var model = {
			modelName: 'foo'
		}
		ctrl = new AssetController(model, svc, fs);
	});

	after(function() {
		mongoose.models = {}
		mongoose.modelSchemas = {}
	})

	it('lists user assets by id', function(done) {
		var req = {}
		var res = {}
		var list = [{ a: '1' }, { b: '2' }]

		req.params = {}
		req.params.username = ''
		req.session = { userId: 'me'}

		svc.findByCreatorId = function(userId) {
			assert.equal('me', userId)
			return resolved(list)
		}

		res.json = function(jl) {
			assert.equal(jl.length, 2)
			assert.deepEqual(jl, list)
			done()
		}

		ctrl.userIndex(req, res)
	})

	it('lists system assets', function(done) {
		var req = {}
		var res = {}
		var list = [{ a: '1' }, { b: '2' }]

		req.params = {}
		req.params.username = ''
		req.session = { userId: 'system'}

		svc.findByCreatorId = function(userId) {
			assert.equal('system', userId)
			return resolved(list)
		}

		res.json = function(jl) {
			assert.equal(jl.length, 2)
			assert.deepEqual(jl, list)
			done()
		}

		ctrl.userIndex(req, res)
	})

})

