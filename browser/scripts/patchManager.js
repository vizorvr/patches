
function PatchManager() {
	EventEmitter.call(this)

	this._patches = []
	this._worldPatches = []
	this._patchesByPath = {}

	this.refresh()

	E2.models.user.on('change', this.refresh.bind(this))
}

PatchManager.prototype = Object.create(EventEmitter.prototype)

PatchManager.prototype.loadPlugins = function() {
	var that = this
	var dfd = when.defer()

	var data = E2.core.pluginsByCategory

	Object.keys(data).forEach(function(catName) {
		Object.keys(data[catName]).forEach(function(title) {
			that.add(catName, title, 'plugin', 'plugin/'+data[catName][title])
		})
	})

	dfd.resolve()

	return dfd.promise
}

PatchManager.prototype.loadPatches = function() {
	var that = this
	var dfd = when.defer()

	function processPatches(data) {
		E2.core.patchesList = data

		data.map(function(patchMeta) {
			// disable Components in production until Components library is ready
			// My Patches will still include them below
			if (Vizor.releaseMode && patchMeta.type === 'entity_component')
				return;

			that.add(patchMeta.category, patchMeta.name, patchMeta.type, patchMeta.url)

			if (E2.WORLD_PATCHES.indexOf(patchMeta.type) > -1)
				that.addWorldPatch(patchMeta.type, patchMeta.category, patchMeta.name, patchMeta.url)
		})

		dfd.resolve()
	}

	if (E2.core.patchesList)
		return processPatches(E2.core.patchesList)

	$.ajax({
		url: '/vizor/patches',
		cache: true
	})
	.done(processPatches)
	.fail(function() {
		msg('ERROR: PatchManager: No patches found.')
		dfd.reject('ERROR: PatchManager: No patches found.')
	})

	return dfd.promise
}

PatchManager.prototype.loadUserPatches = function() {
	var that = this
	var dfd = when.defer()

	var username = E2.models.user.get('username')
	if (!username) {
		dfd.resolve()
	} else {
		$.get('/'+username+'/patches', function(patches) {
			var cat = 'MY PATCHES'

			patches.forEach(function(patch) {
				that.add(cat, patch.name, patch.type, patch.url)

				if (E2.WORLD_PATCHES.indexOf(patch.type) > -1)
					that.addWorldPatch(patch.type, cat, patch.name, patch.url)
			})

			dfd.resolve()
		})
	}

	return dfd.promise
}

PatchManager.prototype.refresh = function() {
	var that = this

	this._patches = []
	this._worldPatches = []
	this._patchesByPath = {}

	this.loadUserPatches()
	.then(function() {
		return that.loadPatches()
	})
	.then(function() {
		return that.loadPlugins()
	})
	.then(function() {
		that.renderPatches()
		that.renderWorldPatches()
	})
}

function categorySort(a, b) {
	if (a.category === 'MY PATCHES')
		return -1

	if (b.category === 'MY PATCHES')
		return 1

	if (a.type === 'plugin' && b.type !== 'plugin')
		return 1

	if (b.type === 'plugin' && a.type !== 'plugin')
		return -1

	var score = a.category.localeCompare(b.category)

	return score
}

PatchManager.prototype.renderPatches = function() {
	var that = this

	new CollapsibleSelectControl()
	.data(this._patches.sort(categorySort))
	.template(E2.views.patches.patches)
	.render(E2.dom.patches_list, {
		searchPlaceholderText : 'Search patches'
	})
	.onOpen(function(selection) {
		if (selection.path.indexOf('plugin/') === 0)
			return that.openPlugin(selection.path)

		that.openPatch(selection)
	})
	
	var patchSearch = $('#patches-lib .searchbox input')
	patchSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui))
}

PatchManager.prototype.renderWorldPatches = function() {
	new CollapsibleSelectControl()
	.data(this._worldPatches.sort(categorySort))
	.template(E2.views.patches.patches)
	.render(E2.dom.objectsList, {
		searchPlaceholderText : 'Search world patches'
	})
	.onOpen(this.openPatch.bind(this))
	
	var objectSearch = $('.searchbox input', E2.dom.objectsList)
	objectSearch.focus(E2.ui.onLibSearchClicked.bind(E2.ui))
}

PatchManager.prototype.openPatch = function(selection) {
	var that = this
	var targetObject3d = selection.targetObject3d
	var patchMeta = this._patchesByPath[selection.path]

	$.ajax({
		url: selection.path,
		dataType: 'text'
	})
	.done(function(data) {
		E2.track({
			event: 'patchAdded',
			title: patchMeta.title,
			category: patchMeta.category,
			type: patchMeta.type,
			path: patchMeta.path
		})

		that.emit('open', patchMeta, data, targetObject3d)
	})
	.fail(function(_j, _textStatus, _errorThrown) {
		msg('ERROR: Failed to load the selected patch.')
		console.error(_errorThrown)
	})
}

PatchManager.prototype.addWorldPatch = function(typeName, category, title, path) {
	var patchMeta = {
		type: typeName || 'patch',
		category: category, 
		title: title,
		path: path
	}

	this._patchesByPath[path] = patchMeta
	this._worldPatches.push(patchMeta)
}

PatchManager.prototype.add = function(category, title, type, path) {
	if (this._patchesByPath[path])
		return;

	var patchMeta = {
		type: type || 'patch',
		category: category, 
		title: title,
		path: path
	}

	this._patchesByPath[path] = patchMeta
	this._patches.push(patchMeta)
}

PatchManager.prototype.openPlugin = function(path, cb) {
	var id = path.substring('plugin/'.length)
	var canvasX = E2.dom.canvases.position().left
	var mouseX = E2.app.mousePosition[0]
	var canvasY = E2.dom.canvases.position().top
	var mouseY = E2.app.mousePosition[1]

	// Add the canvas X position to the mouse X position when double clicking from the patch list to avoid spawning plugins under the list
	if (canvasX > mouseX)
		mouseX += canvasX 
	
	mouseY -= canvasY
	
	E2.app.instantiatePlugin(id, [mouseX, mouseY])
}

