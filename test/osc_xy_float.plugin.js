"use strict";

var fs = require('fs')
var assert = require('assert')

describe('osc_xy_float plugin', function()
{
	var p;

	beforeEach(function()
	{
		var core = { datatypes: {} };
		global.OscProxy = {};
		global.OscProxy.connect = function() {};
		global.E2 = { plugins: [] };
		var PluginCtor = require('../browser/plugins/osc_xy_float.plugin').osc_xy_float
		p = new PluginCtor(core);
	});

	it('connects the proxy on reset', function(done)
	{
		global.OscProxy.connect = function() { done(); };
		p.reset();
	});

	it('returns the correct outputs', function()
	{
		p.x = 1;
		p.y = 2;
		assert.equal(1, p.update_output({ index: 0 }));
		assert.equal(2, p.update_output({ index: 1 }));
	});

	it('registers listener to the given address', function(done)
	{
		var address = '/test/osc/path';
		global.OscProxy.listen = function(a) {
			assert.equal(address, a);
			done();
		}
		p.update_input({ index: 0 }, address);
	});

	it('listens to the given address', function(done)
	{
		var address = '/test/osc/path';
		global.OscProxy.listen = function(a, fn) {
			fn([{ value: 1 }, { value: 2 }]);
			assert.ok(p.updated);
			assert.equal(2, p.update_output({ index: 1}));
			done()
		}
		p.update_input({ index: 0 }, address);
	});

	it('resets correctly', function()
	{
		p.x = 1;
		p.y = 2;
		p.reset();
		assert.equal(0, p.update_output({ index: 0 }));
		assert.equal(0, p.update_output({ index: 1 }));
	});
});
