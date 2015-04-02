var fs = require('fs');
var vm = require('vm');
var browserPath = __dirname+'/../../../';

exports.slot = function slot(index) {
	return { index: index };
}

exports.reset = function() {
	global.E2 = { plugins: {} };

	function leftTop(){ return { left: 0, top: 0 }}
	global.mat4 = {
		create: function() {},
		identity: function(){}
	}
	global.$ = function() { return {
		addClass: function(){},
		removeClass: function(){},
		click: function(){},
		text: function(){},
		offset: leftTop,
		position: leftTop,
		css: function(){ return 0 },
		width: function(){ return 0 },
		height: function(){ return 0 },
		position: function(){ return 0 },
		remove: function(){ }
	}}

	var graphCounter = 0
	core = {
		datatypes: {
			FLOAT: { id: 0, name: 'Float' },
		},
		renderer: {
			context: {},
			canvas: [$()],
			on: function(){}
		},
		graphs: [],
		get_graph_uid: function() {
			return graphCounter++
		}
	};

	E2.core = core
	E2.dt = core.datatypes
	E2.core.resolve_dt = { 0: E2.dt.FLOAT }
	E2.commands = {}

	E2.dom = {
		breadcrumb: {
			children: function() { return $() },
			prepend: function() {}
		},
		canvas: [{ getContext: function(){} }],
		canvas_parent: $()
	}

	global.make = function() {
		return $()
	}

	E2.dom.canvas_parent.scrollTop = E2.dom.canvas_parent.scrollLeft = 
		function() { return 0; }

	return core;
}

exports.loadPlugin = function(name) {
	var js = fs.readFileSync(browserPath+'plugins/'+name+'.plugin.js');
	vm.runInThisContext(js, name);
}

