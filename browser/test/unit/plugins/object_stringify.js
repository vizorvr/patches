var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

var browserPath = __dirname+'/../../../';

function slot(index)
{
	return { index: index };
}

describe('object_stringify', function()
{
	var plugin, core

	beforeEach(function()
	{
		global.$ = {
			extend: function(a, b) { return b; }
		};

		global.E2 = { plugins: {} };
		
		core = {
			datatypes: { OBJECT: 1, TEXT: 2, ANY: 3 }
		};
		
		var js = fs.readFileSync(browserPath+'plugins/object_stringify.plugin.js');
		vm.runInThisContext(js, 'object_stringify');

		plugin = new E2.plugins.object_stringify(core);
	});

	it('serializes objects', function()
	{
		var obj =
		{
			foo: 'bar',
			bar:
			{
				baz: 'qox'
			}
		};
		
		plugin.update_input(slot(0), obj);

		assert.deepEqual(plugin.update_output(),
			JSON.stringify(obj))
	});

});

