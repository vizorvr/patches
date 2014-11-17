var assert = require('assert');
var GraphController = require('../../controllers/graphController');
var when = require('when');

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
		svc = { canWrite: resolved };
		fs =
		{
			url: function(str)
			{
				return '/root'+str;
			},
			writeString: resolved
		};
		ctrl = new GraphController(svc, fs);
	});

	it('handles graph post', function(done)
	{
		var wrote = false;
		fs.writeString = function() {
			wrote = true;
			return resolved();
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

