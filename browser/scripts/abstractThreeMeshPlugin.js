function AbstractThreeMeshPlugin(core) {
	ThreeObject3DPlugin.apply(this, arguments)

	this.desc = 'THREE.js Mesh'

	this.input_slots = [
		{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY,
			array: true,
			def: [new THREE.Geometry()]
		},
		{
			name: 'material',
			dt: core.datatypes.MATERIAL,
			array: true,
			def: [new THREE.MeshBasicMaterial({color: 0x00FF00})]
		}
	].concat(this.input_slots)

	// meshes are create via a helper object
	this.createMeshRoot = function() {}
	this.createMesh = function() {}
	this.createAnimatedMesh = function() {}
}

AbstractThreeMeshPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

AbstractThreeMeshPlugin.prototype.reset = function() {
	ThreeObject3DPlugin.prototype.reset.apply(this)

	this.object3d = this.createMeshRoot()

	this.geoms = [new THREE.Geometry()]
	this.mats = [new THREE.MeshBasicMaterial({color: 0x00ff00})]

	var mesh = this.createMesh(this.geoms[0], this.mats[0])
	this.object3d.add(mesh)

	// back reference for object picking
	this.object3d.backReference = this
}

AbstractThreeMeshPlugin.prototype.update_mesh = function()
{
	var i
	var mesh

	// tbd: optimize this so that we don't always reconstruct meshes
	// but update the ones we can just update
	if (this.geoms_dirty && this.geoms) {
		this.always_update = false

		// non-recursive clone of the root, to preserve transform
		this.object3d = this.object3d.clone(/*recursive = */false)

		for (i = 0; i < this.geoms.length; ++i) {
			if (this.geoms[i].morphTargets && this.geoms[i].morphTargets.length > 0) {
				// clone the material, because we don't want to edit properties on some random material
				var mat = (this.mats && this.mats.length > 0) ? this.mats[i % this.mats.length].clone() : undefined
				mesh = this.createAnimatedMesh(this.geoms[i], mat)
				mesh.material.morphTargets = true
				this.always_update = true
			}
			else {
				mesh = this.createMesh(this.geoms[i], this.mats[i % this.mats.length])
			}
			mesh.backReference = this

			this.object3d.add(mesh)
		}

		this.geoms_dirty = this.mats_dirty = false
	}

	if (this.mats_dirty && this.mats && this.mats.length > 0) {
		for (i = 0; i < this.object3d.children.length; ++i) {
			if (this.object3d.children[i] instanceof THREE.MorphAnimMesh) {
				this.object3d.children[i].material = this.mats[i % this.mats.length].clone()
				this.object3d.children[i].material.morphTargets = true
			}
			else {
				this.object3d.children[i].material = this.mats[i % this.mats.length]
			}
		}

		this.mats_dirty = false
	}
}

AbstractThreeMeshPlugin.prototype.update_input = function(slot, data) {
	if (slot.index === 0) { // geometry
		this.geoms = data
		this.geoms_dirty = true
	}
	else if (slot.index === 1) { // material
		this.mats = data
		this.mats_dirty = true
	}
	else {
		ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
	}
}

AbstractThreeMeshPlugin.prototype.update_state = function() {
	this.update_mesh()
}
