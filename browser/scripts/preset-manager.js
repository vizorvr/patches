
function PresetManager(base_url)
{
	var that = this;

	this._base_url = base_url;
	this._presets = {};

	$.ajax(
	{
		url: base_url + '/presets.json',
		async: false,
		cache: true
	})
	.done(function(data)
	{
		Object.keys(data).forEach(function(catName)
		{
			Object.keys(data[catName]).forEach(function(title)
			{
				that.add(catName, title, data[catName][title]);
			});
		});
	})
	.fail(function() {
		msg('PresetsMgr: No presets found.');
	})
}

PresetManager.prototype.render = function()
{
	var that = this;

	new CollapsibleSelectControl()
	.data(this._presets)
	.template(E2.views.presets.presets)
	.render(E2.dom.presets_list)
	.onOpen(function(path) {
		console.log('path', path)
		if (path.indexOf('plugin/') === 0)
		{
			return that.openPlugin(path);
		}

		var url = that._base_url + '/' + path + '.json';

		msg('Loading preset from: ' + url);

		$.get(url)
		.done(function(data)
		{
			E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0);
			E2.app.onPaste({ target: { id: 'notpersist' }});
		})
		.fail(function(_j, _textStatus, _errorThrown)
		{
  			msg('ERROR: Failed to load the selected preset.');
		})
	})
}

PresetManager.prototype.add = function(category, title, path)
{
	if (!this._presets[category])
		this._presets[category] = {};

	this._presets[category][title] = path;
}

PresetManager.prototype.openPlugin = function(path, cb)
{
	var id = path.substring('plugin/'.length);

	var data = { abs_t: 0, active_graph: 0, graph_uid: 1, root:
		{ node_uid: 1, uid: 0, parent_uid: -1, open: true, nodes:
			[{ plugin: id, x: 50, y: 50, uid: 0}], conns: [] }};

	E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0);
	E2.app.onPaste();
}

