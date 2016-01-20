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
			body: { path: 'foo', graph: '{ "root": {}}' },
			user: { username: 'memyselfandi'}
		},
		{
			json: function(json)
			{
				assert.deepEqual(json,
				{
					path: '/memyselfandi/foo',
					url: '/root/graph/memyselfandi/foo.json',
					tags: [],
					hasAudio: false,
					stat: { size: 0, numAssets: 0 },
					previewUrlSmall: '/root/previews/memyselfandi/foo-preview-440x330.png',
					previewUrlLarge: '/root/previews/memyselfandi/foo-preview-1280x720.png',
				});
				assert.ok(wrote);
				done();
			}
		}, done)
	});

	it('handles anonymous graph post', function(done)
	{
		var wrote = false;
		fs.writeString = function() {
			wrote = true;
			return resolved();
		}
		svc.save = function(data)
		{
			assert.equal(data.path, '/v/foo');
			assert.equal(data.graph, undefined);
			return resolved(data);
		}

		ctrl.save({
			body: { path: 'foo', graph: 'graph' },
			user: { username: 'v'}
		},
		{
			json: function(json)
			{
				assert.deepEqual(json,
				{
					path: '/v/foo',
					url: '/root/graph/v/foo.json',
					tags: []
				});
				assert.ok(wrote);
				done();
			}
		}, done)
	});

});

