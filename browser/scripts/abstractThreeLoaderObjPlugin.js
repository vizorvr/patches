function AbstractThreeLoaderObjPlugin(core) {
	Plugin.apply(this, arguments)
	this.desc = 'THREE.js OBJ loader'
	
	this.dirty = true

	this.state = { url: '' }

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

AbstractThreeLoaderObjPlugin.prototype.update_input = function(slot, data) {
	return Plugin.prototype.update_input.apply(this, arguments)
}

AbstractThreeLoaderObjPlugin.prototype.onObjLoaded = function(geoms, mats) {
	this.geometries = geoms
	this.materials = mats

	msg('Finished loading '+ this.state.url)

	this.updated = true
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

