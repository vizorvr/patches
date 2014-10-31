var assert = require('assert');
var GraphService = require('../../services/graphService');
var _ = require('lodash');

function MockGraph()
{
	this.find = this.findOne = this.exec = 
	this.populate = function() { return this; };
	this.save = function(cb) { cb() }
};

describe('GraphService', function()
{
	var s, model;

	beforeEach(function()
	{
		model = new MockGraph()
		s = new GraphService(model);
	});

	it('handles errors from model', function(done)
	{
		model.exec = function(cb)
		{
			return cb(new Error('nope'));
		};
		s.list()
		.catch(function(err)
		{
			assert.equal(err.message, 'nope');
			done();
		})
	});

	it('lists graphs from model', function(done)
	{
		model.exec = function(cb)
		{
			return cb(null, ['a', 'b']);
		};
		s.list()
		.then(function(list)
		{
			assert.deepEqual(list, ['a', 'b']);
			done();
		});
	});

	it('allows write on non-existent name', function(done)
	{
		model.exec = function(cb)
		{
			return cb(null, null);
		};
		s.canWrite({ id: 'user' }, 'graph')
		.then(function(can)
		{
			assert.ok(can);
			done();
		});
	});

	it('allows write on existing user-owned graph', function(done)
	{
		model.exec = function(cb)
		{
			return cb(null, {_creator: 'someguy' });
		};
		s.canWrite({ id: 'someguy' }, 'graph')
		.then(function(can)
		{
			assert.ok(can);
			done();
		});
	});

	it('denies write on existing non-user-owned graph', function(done)
	{
		model.exec = function(cb)
		{
			return cb(null, {_creator: 'someguy' });
		};
		s.canWrite({ id: 'user' }, 'graph')
		.then(function(can)
		{
			assert.ok(!can);
			done();
		});
	});

	it('can find by name', function(done)
	{
		model.findOne = function(search)
		{
			assert.equal(search.name, 'somegraph')
			return this;
		};
		model.exec = function(cb)
		{
			return cb();
		};
		s.findByName('somegraph')
		.then(function()
		{
			done();
		});
	});

	it('can save', function(done)
	{
		function MockSave(data) {
			_.extend(this, data);
		}
		MockSave.exec = function(cb) { cb() }
		MockSave.populate = function() { return this; }
		MockSave.findOne = function() { return this; }
		MockSave.prototype.save = function() {
			assert.equal(this._creator, 'someguy');
			assert.equal(this.url, 'somegraph');
			done()
		}
		s = new GraphService(MockSave);
		s.save({url: 'somegraph'}, {id: 'someguy'});
	});
});

