var expect = require('chai').expect;
var fs = require('fs-extra');
var GraphOptimizer = require('../../lib/graphOptimizer');

describe('Graph optimizer', function() {
	var source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/te-2rb.json').toString());
	var optimized = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/te-2rb.optimized.json').toString());

	it('produces the right output', function() {
		var oldEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';

		var output = new GraphOptimizer()
			.graph(source)
			.optimize();

		expect(output).to.deep.equal(optimized);
		process.env.NODE_ENV = oldEnv;
	});

});

