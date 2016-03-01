(function() {
	var createThreeMeshRoot = function() {
		return new THREE.Object3D()
	}

	var createThreeMeshLineMesh = function(geom, mats) {
		// Have to convert the bufferGeometry to THREE.Geometry(), as the MeshLine only
		// accepts THREE.Geometry()
		var set_geom;

		if (geom instanceof THREE.Geometry) {
			set_geom = geom;
		} else if (geom instanceof THREE.BufferGeometry) {
			set_geom = new THREE.Geometry().fromBufferGeometry(geom)
		}

		// Create our meshLine object, which is actually not a Mesh or a object3d, but
		// only contains a bufferGeometry meshLine.geometry
		this.meshLine = new THREE.MeshLine()
		this.meshLine.setGeometry(set_geom)

		// We need this for the raycast method to work
		this.meshLine.setMatrixWorld(this.object3d.matrixWorld)

		// Create our actual THREE.Mesh that is then added to our scene
		mesh = new THREE.Mesh(this.meshLine.geometry, mats)

		// Override the default raycast
		var that = this
		this.object3d.raycast = function() { 
			// Raycast with the mesh, so it gets added to the intersected objects
			// Not the MeshLine instance
			return that.meshLine.raycast.apply(mesh, arguments)
		}

		return mesh
	}

	var ThreeMeshLinePlugin = E2.plugins.three_meshline_mesh = function(core) {
		AbstractThreeMeshPlugin.apply(this, arguments)

		this.desc = 'THREE.js MeshLine Mesh'

		this.createMeshRoot = createThreeMeshRoot
		this.createAnimatedMesh = createThreeMeshLineMesh
		this.createMesh = createThreeMeshLineMesh
	}

	ThreeMeshLinePlugin.prototype = Object.create(AbstractThreeMeshPlugin.prototype)

	ThreeMeshLinePlugin.prototype.update_input = function(slot, data) {
		AbstractThreeMeshPlugin.prototype.update_input.apply(this, arguments)
	}
})()

