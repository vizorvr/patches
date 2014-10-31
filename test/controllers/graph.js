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
		fs = { move: resolved }
		ctrl = new GraphController(svc, fs);
	});

	it('handles graph post', function(done)
	{
		svc.save = function(data)
		{
			data.slug = 'ok';
			assert.equal(data.name, 'foo');
			return resolved(data);
		}

		ctrl.save(
		{
			body: { name: 'foo', graph: 'graph' }
		},
		{
			json: function(json)
			{
				assert.deepEqual(json,
				{
					name: 'foo',
					graph: 'graph', 
					slug: 'ok'
				});
				done()
			}
		});
	});

});

