var when = require('when');
var settings = require('../config/settings');	

// Set of plugins that may contain references to external dependencies.
var urlPlugins = [
	'url_audio_buffer_generator',
	'url_audio_generator',
	'url_json_generator',
	'url_scene_generator',
	'url_texture_generator',
	'url_video_generator'
];

// Set of plugins the title of which has a functional purpose and must thus be retained.
var maintainTitle = [
	'register_global_read',
	'register_global_write',
	'register_local_read',
	'register_local_write'
];

// Set of plugins that can be removed without compromising graph functionality.
var filteredPlugins = [
	'annotation',
	'bool_display',
	'color_display',
	'data_info_display',
	'float_display',
	'led_display',
	'log_display',
	'matrix_display',
	'object_display',
	'plot_display',
	'text_display',
	'vector_display'
];

function removeItem(coll, item)
{
	coll.splice(coll.indexOf(item), 1);
}

function deleteNode(graph, node)
{
	var nuid = node.uid;

	removeItem(graph.nodes, node);
	
	graph.conns = graph.conns.filter(function(c)
	{	
		return (c.src_nuid !== nuid && c.dst_nuid !== nuid)
	});
}

function pruneDynamicSlots(slots) {
	slots.forEach(function(slot) {
		delete slot.desc
		delete slot.type
		delete slot.connected
		delete slot.is_connected
		delete slot.def
	})
}

function _makeUrlAbsolute(url)
{
	if (url[0] !== '/')
		url = '/' + url;

	if (settings.fqdn)
	{
		console.log('FQDN', settings.fqdn)
		url = '//' + settings.fqdn + url;
	}

	return url;
}

// --------------------------------------------

function GraphOptimizer() {}
GraphOptimizer.prototype.graph = function(src)
{
	this.graph = src;
	return this;
}

GraphOptimizer.prototype.optimize = function(graph)
{
	var that = this;
	var pruned = [];
	graph = graph || this.graph.root;

	delete graph.open;
	delete graph.scroll;

	graph.nodes.forEach(function(node)
	{
		if (node.plugin === 'graph' || node.plugin === 'loop')
		{
			that.optimize(node.graph);
		} else if (filteredPlugins.indexOf(node.plugin) > -1)
		{	
			pruned.push(node);
			return;
		}

		delete node.x;
		delete node.y;

		if (urlPlugins.indexOf(node.plugin) > -1 && node.state.url)
			node.state.url = _makeUrlAbsolute(node.state.url);

		if (maintainTitle.indexOf(node.plugin) === -1)
			delete node.title;

		if (node.dyn_in)
			pruneDynamicSlots(node.dyn_in);

		if (node.dyn_out)
			pruneDynamicSlots(node.dyn_out);
	});

	pruned.forEach(function(prune)
	{
		deleteNode(graph, prune);
	});

	graph.conns.forEach(function(conn)
	{
		delete conn.offset;
	});

	return this.graph;
}

module.exports = GraphOptimizer;

