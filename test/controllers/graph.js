var assert = require('assert');
var GraphController = require('../../controllers/graphController');
var when = require('when');

describe('GraphController', function()
{
	var ctrl, svc;
	var resolved = function(data)
	{
		var dfd = when.defer();
		dfd.resolve(data || true);
		return dfd.promise;
	};

	beforeEach(function()
	{
		svc = { canWrite: resolved };
		ctrl = new GraphController(svc);
	});

	it('handles graph post', function(done)
	{
		svc.save = function(data)
		{
			assert.equal(data.name, 'foo');
			return resolved({ slug: 'ok' });
		}
		ctrl.save(
		{
			body: { name: 'foo', graph: 'graph' }
		},
		{
			json: function(json)
			{
				assert.equal(json.slug, 'ok')
				done()
			}
		});
	});
});

