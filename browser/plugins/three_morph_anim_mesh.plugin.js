(function() {
	var ThreeMorphAnimMeshPlugin = E2.plugins.three_morphanimmesh = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js MorphAnimMesh'
		
		this.input_slots = [
			{ name: 'geometry', dt: core.datatypes.GEOMETRY },
			{ name: 'material', dt: core.datatypes.MATERIAL },
		].concat(this.input_slots)
	}

	ThreeMorphAnimMeshPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeMorphAnimMeshPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
		this.object3d = new THREE.MorphAnimMesh(this.geometry, this.material)

		// back reference for object picking
		this.object3d.backReference = this
	}

})()

