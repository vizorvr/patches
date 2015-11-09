
function PresetManager(base_url)
{
	EventEmitter.call(this)

	this._base_url = base_url
	this._presets = []

	this.refresh()

	E2.models.user.on('change', this.refresh.bind(this))
}

PresetManager.prototype = Object.create(EventEmitter.prototype)

PresetManager.prototype.loadPlugins = function(cb) {
	var that = this

	var data = E2.core.pluginsByCategory

	Object.keys(data).forEach(function(catName) {
		Object.keys(data[catName]).forEach(function(title) {
			that.add(catName, title, 'plugin/'+data[catName][title])
		})
	})
	cb()
}

PresetManager.prototype.loadPresets = function(cb) {
	var that = this

	if (E2.core.presetsByCategory)
		processPresets(E2.core.presetsByCategory)

	function processPresets(data) {
		E2.core.presetsByCategory = data

		Object.keys(data).forEach(function(catName) {
			Object.keys(data[catName]).forEach(function(title) {
				that.add(catName, title, that._base_url+'/'+data[catName][title]+'.json')
			})
		})

		cb()
	}

	$.ajax({
		url: this._base_url + '/presets.json',
		cache: true
	})
	.done(processPresets)
	.fail(function() {
		msg('ERROR: PresetsMgr: No presets found.')
	})
}

PresetManager.prototype.loadUserPresets = function(cb) {
	var that = this
	var username = E2.models.user.get('username')
	if (!username)
		return cb()

	$.get('/'+username+'/presets', function(presets) {
		var cat = 'MY PRESETS'

		presets.forEach(function(preset) {
			that.add(cat, preset.name, preset.url)
		})

		cb()
	})
}

PresetManager.prototype.refresh = function() {
	var that = this

	this.loadUserPresets(function() {
		that.loadPresets(function() {
			that.loadPlugins(function() {
				that.render()
			})
		})
	})
}

PresetManager.prototype.render = function()
{
	var that = this

	E2.dom.presets_list.empty()

	new CollapsibleSelectControl()
	.data(this._presets)
	.template(E2.views.presets.presets)
	.render(E2.dom.presets_list)
	.onOpen(function(path) {
		if (path.indexOf('plugin/') === 0) {
			return that.openPlugin(path);
		}

		msg('Loading preset from: ' + path);

		that.openPreset(path)
	})
	
	var presetSearch = $('#presets-lib .searchbox input');
	presetSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui));
}

PresetManager.prototype.openPreset = function(name) {
	$.get(name)
	.done(function(data) {
		E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0)
		E2.app.onPaste()
	})
	.fail(function(_j, _textStatus, _errorThrown) {
		msg('ERROR: Failed to load the selected preset.')
		console.error(_errorThrown)
	})
}

PresetManager.prototype.add = function(category, title, path) {
	this._presets.push({
		category: category, 
		title: title,
		path: path
	})
}

PresetManager.prototype.openPlugin = function(path, cb)
{
	var id = path.substring('plugin/'.length);
	var canvasX = E2.dom.canvas_parent.position().left;
	var mouseX = E2.app.mousePosition[0];
	var canvasY = E2.dom.canvas_parent.position().top;
	var mouseY = E2.app.mousePosition[1];

	if(canvasX > mouseX) mouseX += canvasX; // Add the canvas X position to the mouse X position when double clicking from the preset list to avoid spawning plugins under the list
	E2.app.instantiatePlugin(id, [mouseX, mouseY]);
}

