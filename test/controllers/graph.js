var assert = require('assert');

describe('GraphController', function()
{
	var ctrl;

	beforeEach(function()
	{
		ctrl = require('../../controllers/graph');
	});

	it('handles graph post', function(done)
	{
		ctrl.postGraph(
		{
			body: { name: 'foo', graph: 'graph' }
		},
		{
			json: function(json)
			{
				assert.equal(json.slug === 'foo');
				done()
			}
		});
	});
});

