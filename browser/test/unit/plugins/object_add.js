var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

var browserPath = __dirname+'/../../../';

describe('object_add', function()
{
	var plugin, core

	beforeEach(function()
	{
		global.$ = {
			extend: function(a, b)
			{
				return b;
			}
		};

		global.E2 = { plugins: {} };
		
		core = {
			datatypes: { OBJECT: 1, TEXT: 2, ANY: 3 }
		};
		
		var js = fs.readFileSync(browserPath+'plugins/object_add.plugin.js');
		vm.runInThisContext(js, 'object_add');

		plugin = new E2.plugins.object_add(core);
	});

	it('declares plugin', function()
	{
		assert.ok(E2.plugins['object_add']);
	});

	it('declares input slots', function()
	{
		assert.ok(plugin.input_slots.length, 3);
	});

	it('composes new objects', function()
	{
		plugin.update_input(1, 'foo');
		plugin.update_input(2, 'bar');

		assert.deepEqual(plugin.update_output(),
		{
			foo: 'bar'
		})
	});

	it('augments existing objects', function()
	{
		plugin.update_input(0, { bar: 'baz' });
		plugin.update_input(1, 'foo');
		plugin.update_input(2, 'bar');

		assert.deepEqual(plugin.update_output(),
		{
			foo: 'bar',
			bar: 'baz'
		})
	});

	it('nests existing objects', function()
	{
		plugin.update_input(1, 'foo');
		plugin.update_input(2, 'bar');
		var out = plugin.update_output();
		var p2 = new E2.plugins.object_add(core);
		p2.update_input(1, 'abc');
		p2.update_input(2, out);

		assert.deepEqual(p2.update_output(),
		{
			abc:
			{
				foo: 'bar'
			}
		})
	});

});

