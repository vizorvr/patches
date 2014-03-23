var fs = require('fs');
var plugins = require('/Users/anttijadertpolm/Documents/bootstrap/engi/browser/plugins/plugins.json');

for(var key in plugins)
{
	var pid = plugins[key];
	var json = '{ "abs_t": 0, "active_graph": 0, "graph_uid": 1, "root": { "node_uid": 1, "uid": 0, "parent_uid": -1, "open": true, "nodes": [{ "plugin": "' + pid + '", "x": 50, "y": 50, "uid": 0}], "conns": [] }}';
	
	fs.writeFile('plugin-' + pid.replace('_', '-') + '.json', json);
}
