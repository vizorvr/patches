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
			assert.equal(data.path, '/memyselfandi/foo');
			assert.equal(data.graph, undefined);
			return resolved(data);
		}

		ctrl.save({
			body: { path: 'foo', graph: 'graph' },
			user: { username: 'memyselfandi'}
		},
		{
			json: function(json)
			{
				assert.deepEqual(json,
				{
					path: '/memyselfandi/foo',
					url: '/root/graph/memyselfandi/foo.json',
					tags: []
				});
				assert.ok(wrote);
				done();
			}
		}, done)
	});

});

