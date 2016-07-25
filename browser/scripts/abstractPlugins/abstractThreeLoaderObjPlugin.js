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

AbstractThreeLoaderObjPlugin.prototype.update_input = function() {
	return Plugin.prototype.update_input.apply(this, arguments)
}

AbstractThreeLoaderObjPlugin.prototype.onObjLoaded = function(geoms, mats) {
	this.geometries = geoms
	this.materials = mats

	for (var i = 0; i < this.geometries.length; ++i) {
		var bufferGeometryHasVtxNormals =
			this.geometries[i] instanceof THREE.BufferGeometry &&
			this.geometries[i].getAttribute('normal') !== undefined

		var normalGeometryHasFaceNormals =
			(this.geometries[i].faces && this.geometries[i].faces.length > 0 &&
			this.geometries[i].faces[0].normal.lengthSq() !== 0)

		var normalGeometryHasVtxNormals =
			(this.geometries[i].faces && this.geometries[i].faces.length > 0 &&
			this.geometries[i].faces[0].vertexNormals.length > 0)
		
		if (!bufferGeometryHasVtxNormals && !normalGeometryHasFaceNormals && !normalGeometryHasVtxNormals) {
			this.geometries[i].computeVertexNormals(true)
		}
	}

	msg('Finished loading '+ this.state.url)

	this.updated = true
}

AbstractThreeLoaderObjPlugin.prototype.state_changed = function(ui) {
	if (!this.state.url)
		return

	if (ui)
		ui.attr('title', this.state.url)
	else
		this.dirty = true
}

if (typeof(module) !== 'undefined')
	module.exports = AbstractThreeLoaderObjPlugin


