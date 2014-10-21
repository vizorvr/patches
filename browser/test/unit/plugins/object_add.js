var assert = require('assert');

var slot = require('./helpers').slot;
var reset = require('./helpers').reset;
var loadPlugin = require('./helpers').loadPlugin;

describe('object_add', function()
{
	var plugin, core

	beforeEach(function()
	{
		core = reset();
		loadPlugin('object_add');
		plugin = new E2.plugins.object_add(core);
	});

	it('declares the right slots', function()
	{
		assert.ok(plugin.input_slots.length, 3);
		assert.ok(plugin.output_slots.length, 1);
	});

	it('composes new objects', function()
	{
		plugin.update_input(slot(1), 'foo');
		plugin.update_input(slot(2), 'bar');

		assert.deepEqual(plugin.update_output(),
		{
			foo: 'bar'
		});
	});

	it('adds to objects', function()
	{
		plugin.update_input(slot(0), { bar: 'baz' });
		plugin.update_input(slot(1), 'foo');
		plugin.update_input(slot(2), 'bar');

		assert.deepEqual(plugin.update_output(),
		{
			foo: 'bar',
			bar: 'baz'
		});
	});

	it('nests objects', function()
	{
		plugin.update_input(slot(1), 'foo');
		plugin.update_input(slot(2), 'bar');
		var out = plugin.update_output();
		var p2 = new E2.plugins.object_add(core);
		p2.update_input(slot(1), 'abc');
		p2.update_input(slot(2), out);

		assert.deepEqual(p2.update_output(),
		{
			abc:
			{
				foo: 'bar'
			}
		});
	});

	it('extends objects given empty object as first value', function()
	{
		plugin.update_input(slot(1), 'foo');
		plugin.update_input(slot(2), {});
		var out = plugin.update_output();
		var p2 = new E2.plugins.object_add(core);
		p2.update_input(slot(0), out);
		p2.update_input(slot(1), 'abc');
		p2.update_input(slot(2), 'bar');

		assert.deepEqual(p2.update_output(),
		{
			foo: {},
			abc: 'bar'
		});
	});

});

