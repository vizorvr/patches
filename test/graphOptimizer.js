var assert = require('assert');
var fs = require('fs-extra');
var GraphOptimizer = require('../lib/graphOptimizer');

describe('Graph optimizer', function()
{
	var source = JSON.parse(fs.readFileSync(__dirname+'/fixtures/te-2rb.json').toString());
	var optimized = JSON.parse(fs.readFileSync(__dirname+'/fixtures/te-2rb.optimized.json').toString());

	it('produces the right output', function()
	{
		var output = new GraphOptimizer()
			.graph(source)
			.optimize()

		console.log('result', JSON.stringify(output));
		assert.deepEqual(output, optimized)
	});

});

