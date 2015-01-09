var assert = require('assert');

var slot = require('./helpers').slot;
var reset = require('./helpers').reset;
var loadPlugin = require('./helpers').loadPlugin;

describe('gamepad_generator', function()
{
	var plugin, core;
	var buttons = [];

	beforeEach(function()
	{
		core = reset();
		global.navigator =
		{
			getGamepads: function()
			{
				return [{
					buttons: buttons,
					axes: [ 0.51 ]
				}]
			}
		};
		loadPlugin('gamepad_generator');
		plugin = new E2.plugins.gamepad_generator(core);
	});

	it('declares the right slots', function()
	{
		assert.equal(plugin.output_slots.length, 21);
	});

	it('reports the right value for axis', function()
	{
		var axis = plugin.update_output({ index: 17 });
		assert.equal(axis, 0.51);
	});

});

