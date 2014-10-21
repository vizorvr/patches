var assert = require('assert');

var slot = require('./helpers').slot;
var reset = require('./helpers').reset;
var loadPlugin = require('./helpers').loadPlugin;

describe('object_stringify', function()
{
	var plugin, core

	beforeEach(function()
	{
		core = reset();
		loadPlugin('object_stringify');
		plugin = new E2.plugins.object_stringify(core);
	});

	it('declares the right slots', function()
	{
		assert.ok(plugin.input_slots.length, 1);
		assert.ok(plugin.output_slots.length, 1);
	});

	it('serializes objects', function()
	{
		var obj =
		{
			foo: 'bar',
			bar: {
				baz: 'qox'
			}
		};
		
		plugin.update_input(slot(0), obj);

		assert.deepEqual(plugin.update_output(),
			JSON.stringify(obj))
	});

});

