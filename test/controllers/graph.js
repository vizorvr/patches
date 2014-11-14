var assert = require('assert');
var GraphController = require('../../controllers/graphController');
var when = require('when');
var EventEmitter = require('events').EventEmitter;

describe('GraphController', function()
{
	var ctrl, svc, stream;
	var resolved = function(data)
	{
		var dfd = when.defer();
		dfd.resolve(data || true);
		return dfd.promise;
	};

	beforeEach(function()
	{

		stream = new EventEmitter();
		stream.writable = true
		stream.write = function() { return true; };
		stream.end = function() { this.emit('close') };

		svc = { canWrite: resolved };
		fs =
		{
			url: function(str)
			{
				return '/root'+str;
			},
			createWriteStream: function()
			{
				var dfd = when.defer();
				dfd.resolve(stream);
				return dfd.promise;
			}
		};
		ctrl = new GraphController(svc, fs);
	});

	it('handles graph post', function(done)
	{
		var wrote = false;
		stream.write = function() {
			wrote = true;
			return true;
		}
		svc.save = function(data)
		{
			data.slug = 'ok';
			assert.equal(data.path, '/graph/foo');
			assert.equal(data.graph, undefined);
			return resolved(data);
		}

		ctrl.save({ body: { path: 'foo', graph: 'graph' } },
		{
			json: function(json)
			{
				assert.deepEqual(json,
				{
					path: '/graph/foo',
					url: '/root/graph/foo',
					tags: [],
					slug: 'ok'
				});
				assert.ok(wrote);
				done();
			}
		}, done)
	});

});

