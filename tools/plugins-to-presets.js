var fs = require('fs');
var plugins = require('../browser/plugins/plugins.json');
var presets = [];

for(var key in plugins)
{
	var pid = plugins[key];
	var json = '{ "abs_t": 0, "active_graph": 0, "graph_uid": 1, "root": { "node_uid": 1, "uid": 0, "parent_uid": -1, "open": true, "nodes": [{ "plugin": "' + pid + '", "x": 50, "y": 50, "uid": 0}], "conns": [] }}';
	var fname = 'plugin-' + pid.replace('_', '-');
	
	fs.writeFile('../browser/presets/' + fname + '.json', json);
	presets.push('\t\t"' + key + '": "' + fname + '"');
}

console.log(presets.join(',\n'));
