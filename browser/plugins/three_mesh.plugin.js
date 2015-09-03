(function() {
	var ThreeMeshPlugin = E2.plugins.three_mesh = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Mesh'
		
		this.input_slots = [
			{ name: 'geometry', dt: core.datatypes.GEOMETRY, def: new THREE.Geometry() },
			{ name: 'material', dt: core.datatypes.MATERIAL, def: new THREE.MeshBasicMaterial({color: 0xaaaaaa}) }
		].concat(this.input_slots)
	}

	ThreeMeshPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeMeshPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
		this.object3d = new THREE.Mesh(this.geometry, this.material)

		// back reference for object picking
		this.object3d.backReference = this
	}

})()

