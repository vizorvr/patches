function AbstractThreeLoaderObjPlugin(core) {
	Plugin.apply(this, arguments)
	this.desc = 'THREE.js OBJ loader'
	
	this.dirty = true

	this.childrenByMaterialName = {}
	this.state = { url: '' }
	this.materials = {}

	this.input_slots = []

	this.output_slots = [{
		name: 'geometry',
		dt: core.datatypes.GEOMETRY,
		array: true
	},
	{
		name: 'materials',
		dt: core.datatypes.MATERIAL,
		array: true
	}]

	this.geometries = [new THREE.Geometry()]
	this.materials = [new THREE.MeshBasicMaterial(0xff0000)]
}

AbstractThreeLoaderObjPlugin.prototype = Object.create(Plugin.prototype)

AbstractThreeLoaderObjPlugin.prototype.create_ui = function() {
	var inp = makeButton('Change', 'No scene selected.', 'url')
	var that = this
	
	inp.click(function() {
		var oldValue = that.state.url
		var newValue

		FileSelectControl
			.createSceneSelector(that.state.url)
			.onChange(function(v) {
				newValue = that.state.url = v
				that.state_changed(null)
				that.state_changed(inp)
				that.updated = true
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return
				console.log('closed', newValue, that.state.url)
				that.undoableSetState('url', newValue, oldValue)
			})
	})

	return inp
}

AbstractThreeLoaderObjPlugin.prototype.update_input = function(slot, data) {
	return Plugin.prototype.update_input.apply(this, arguments)
}

AbstractThreeLoaderObjPlugin.prototype.onObjLoaded = function(geoms, mats) {
	this.geometries = geoms
	this.materials = mats

	msg('Finished loading '+ this.state.url)

	this.childrenByMaterialName = {}

	this.updated = true
}

AbstractThreeLoaderObjPlugin.prototype.update_state = function() {
	if (!this.dirty)
		return

	if (!this.state.url)
		return;

	if (this.geometries)
		this.geometries = null

	THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader())

	console.log('AbstractThreeLoaderObjPlugin loading', this.state.url)

	this.loadObj()

	this.dirty = false
}

AbstractThreeLoaderObjPlugin.prototype.loadObj = function() {
	var that = this
	var loader = new THREE.OBJLoader()
	loader.load(this.state.url, this.onObjLoaded.bind(this), function() {
		console.log('Loading progress', that.state.url, arguments)
	}, function(err) {
		msg('ERROR: '+err.toString())
	})
}

AbstractThreeLoaderObjPlugin.prototype.state_changed = function(ui) {
	console.log('state_changed', this.state)
	if (!this.state.url)
		return

	if (ui)
		ui.attr('title', this.state.url)
	else
		this.dirty = true
}

