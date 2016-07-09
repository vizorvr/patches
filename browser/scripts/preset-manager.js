
function PresetManager(base_url) {
	EventEmitter.call(this)

	this._base_url = base_url
	this._patches = []
	this._worldPatches = []
	this._patchesByPath = {}

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
				if (E2.TYPED_PATCHES.indexOf(entry.type) > -1)
					that.addWorldPatch(entry.type, catName, title, that._base_url+'/'+name+'.json')
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
				if (E2.TYPED_PATCHES.indexOf(preset.type) > -1)
					that.addWorldPatch(preset.type, cat, preset.name, preset.url)

				that.add(cat, preset.name, preset.url)
			})

			dfd.resolve()
		})
	}

	return dfd.promise
}

PresetManager.prototype.refresh = function() {
	var that = this

	this._patches = []
	this._worldPatches = []

	this.loadUserPresets()
	.then(function() {
		return that.loadPresets()
	})
	.then(function() {
		return that.loadPlugins()
	})
	.then(function() {
		that.renderPresets()
		that.renderWorldPatches()
	})
}

PresetManager.prototype.renderPresets = function() {
	var that = this

	E2.dom.presets_list.empty()

	new CollapsibleSelectControl()
	.data(this._patches)
	.template(E2.views.presets.presets)
	.render(E2.dom.presets_list, {
		searchPlaceholderText : 'Search patches'
	})
	.onOpen(function(selection) {
		if (selection.path.indexOf('plugin/') === 0)
			return that.openPlugin(selection.path)

		that.openPreset(selection)
	})
	
	var presetSearch = $('#presets-lib .searchbox input')
	presetSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui))
}

PresetManager.prototype.renderWorldPatches = function() {
	E2.dom.objectsList.empty()

	new CollapsibleSelectControl()
	.data(this._worldPatches)
	.template(E2.views.presets.presets)
	.render(E2.dom.objectsList, {
		searchPlaceholderText : 'Search items'
	})
	.onOpen(this.openPreset.bind(this))
	
	var objectSearch = $('.searchbox input', E2.dom.objectsList)
	objectSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui))
}

PresetManager.prototype.openPreset = function(selection) {
	var that = this
	var targetObject3d = selection.targetObject3d
	var patchMeta = this._patchesByPath[selection.path]

	$.ajax({
		url: selection.path,
		dataType: 'text'
	})
	.done(function(data) {
		E2.track({
			event: 'presetAdded',
			title: patchMeta.title,
			category: patchMeta.category,
			type: patchMeta.type,
			path: patchMeta.path
		})

		that.emit('open', patchMeta, data, targetObject3d)
	})
	.fail(function(_j, _textStatus, _errorThrown) {
		msg('ERROR: Failed to load the selected preset.')
		console.error(_errorThrown)
	})
}

PresetManager.prototype.addWorldPatch = function(typeName, category, title, path) {
	var patchMeta = {
		type: typeName,
		category: category, 
		title: title,
		path: path
	}

	this._patchesByPath[path] = patchMeta
	this._worldPatches.push(patchMeta)
}

PresetManager.prototype.add = function(category, title, path) {
	if (this._patchesByPath[path])
		return;

	var patchMeta = {		
		type: 'patch',
		category: category, 
		title: title,
		path: path
	}

	this._patchesByPath[path] = patchMeta
	this._patches.push(patchMeta)
}

PresetManager.prototype.openPlugin = function(path, cb) {
	var id = path.substring('plugin/'.length)
	var canvasX = E2.dom.canvases.position().left
	var mouseX = E2.app.mousePosition[0]
	var canvasY = E2.dom.canvases.position().top
	var mouseY = E2.app.mousePosition[1]

	// Add the canvas X position to the mouse X position when double clicking from the preset list to avoid spawning plugins under the list
	if (canvasX > mouseX)
		mouseX += canvasX 
	
	mouseY -= canvasY
	
	E2.app.instantiatePlugin(id, [mouseX, mouseY])
}

