var fs = require('fs');
var vm = require('vm');
var browserPath = __dirname+'/../../../';

exports.slot = function slot(index)
{
	return { index: index };
}

exports.reset = function()
{
	global.$ = {
		extend: function(a, b) {
			return b;
		}
	};

	global.E2 = { plugins: {} };

	core = {
		datatypes: { OBJECT: 1, TEXT: 2, ANY: 3 }
	};

	return core;
}

exports.loadPlugin = function(name)
{
	var js = fs.readFileSync(browserPath+'plugins/'+name+'.plugin.js');
	vm.runInThisContext(js, name);
}