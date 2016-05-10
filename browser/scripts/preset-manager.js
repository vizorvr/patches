
function PresetManager(base_url)
{
	EventEmitter.call(this)

	this._base_url = base_url
	this._presets = []
	this._objects = []

	this.refresh()

	E2.models.user.on('change', this.refresh.bind(this))
}

PresetManager.prototype = Object.create(EventEmitter.prototype)

PresetManager.prototype.loadPlugins = function() {
	var that = this
	var dfd = when.defer()

	var data = E2.core.pluginsByCategory

	Object.keys(data).forEach(function(catName) {
		Object.keys(data[catName]).forEach(function(title) {
			that.add(catName, title, 'plugin/'+data[catName][title])
		})
	})

	dfd.resolve()

	return dfd.promise
}

PresetManager.prototype.loadPresets = function() {
	var that = this
	var dfd = when.defer()

	function processPresets(data) {
		E2.core.presetsByCategory = data

		Object.keys(data).forEach(function(catName) {
			Object.keys(data[catName]).forEach(function(title) {
				var entry = data[catName][title]
				var name = entry.name
				that.add(catName, title, that._base_url+'/'+name+'.json')

				if (entry.isObject3d)
					that.addObject3d(catName, title, that._base_url+'/'+name+'.json')
			})
		})

		dfd.resolve()
	}

	if (E2.core.presetsByCategory)
		return processPresets(E2.core.presetsByCategory)

	$.ajax({
		url: this._base_url + '/presets.json',
		cache: true
	})
	.done(processPresets)
	.fail(function() {
		msg('ERROR: PresetsMgr: No presets found.')
		dfd.reject('ERROR: PresetsMgr: No presets found.')
	})

	return dfd.promise
}

PresetManager.prototype.loadUserPresets = function() {
	var that = this
	var dfd = when.defer()

	var username = E2.models.user.get('username')
	if (!username) {
		dfd.resolve()
	} else {
		$.get('/'+username+'/presets', function(presets) {
			var cat = 'MY PRESETS'

			presets.forEach(function(preset) {
				that.add(cat, preset.name, preset.url)
			})

			dfd.resolve()
		})
	}

	return dfd.promise
}

PresetManager.prototype.refresh = function() {
	var that = this

	this._presets = []

	this.loadUserPresets()
	.then(function() {
		return that.loadPresets()
	})
	.then(function() {
		return that.loadPlugins()
	})
	.then(function() {
		that.renderPresets()
		that.renderObjects()
	})
}

PresetManager.prototype.onOpen = function(path) {
	if (path.indexOf('plugin/') === 0) {
		return this.openPlugin(path);
	}

	this.openPreset(path)
}

PresetManager.prototype.renderPresets = function() {
	E2.dom.presets_list.empty()

	new CollapsibleSelectControl()
	.data(this._presets)
	.template(E2.views.presets.presets)
	.render(E2.dom.presets_list, {
		searchPlaceholderText : 'Search patches'
	})
	.onOpen(this.onOpen.bind(this))
	
	var presetSearch = $('#presets-lib .searchbox input');
	presetSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui, E2.dom.presets_list));
}

PresetManager.prototype.renderObjects = function() {
	E2.dom.objectsList.empty()

	new CollapsibleSelectControl()
	.data(this._objects)
	.template(E2.views.presets.presets)
	.render(E2.dom.objectsList, {
		searchPlaceholderText : 'Search objects'
	})
	.onOpen(this.onOpen.bind(this))
	
	var objectSearch = $('.searchbox input', E2.dom.objectsList);
	objectSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui, E2.dom.objectsList));
}

PresetManager.prototype.openPreset = function(name) {
	$.get(name)
	.done(function(data) {
		E2.track({
			event: 'Preset Added', 
			name: name
		})

		var doc = E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0)
		E2.app.onPaste(doc)
	})
	.fail(function(_j, _textStatus, _errorThrown) {
		msg('ERROR: Failed to load the selected preset.')
		console.error(_errorThrown)
	})
}

PresetManager.prototype.addObject3d = function(category, title, path) {
	this._objects.push({
		category: category, 
		title: title,
		path: path
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
	var canvasX = E2.dom.canvases.position().left;
	var mouseX = E2.app.mousePosition[0];
	var canvasY = E2.dom.canvases.position().top;
	var mouseY = E2.app.mousePosition[1];

	if(canvasX > mouseX) mouseX += canvasX; // Add the canvas X position to the mouse X position when double clicking from the preset list to avoid spawning plugins under the list
	mouseY -= canvasY
	E2.app.instantiatePlugin(id, [mouseX, mouseY]);
}

