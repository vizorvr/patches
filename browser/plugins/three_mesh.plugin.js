(function() {
	var createThreeMeshRoot = function() {
		return new THREE.Object3D()
	}

	var createThreeAnimatedMesh = function(geom, mats) {
		return new THREE.MorphAnimMesh(geom, mats)
	}

	var createThreeMesh = function(geom, mats) {
		return new THREE.Mesh(geom, mats)
	}

	var ThreeMeshPlugin = E2.plugins.three_mesh = function(core) {
		AbstractThreeMeshPlugin.apply(this, arguments)

		this.input_slots = [
			{
				name: 'object3d',
				dt: core.datatypes.OBJECT3D,
				desc: 'Optional existing mesh to modify',
				def: null
			}
		].concat(this.input_slots)

		this.desc = 'THREE.js Mesh'

		this.createMeshRoot = createThreeMeshRoot
		this.createAnimatedMesh = createThreeAnimatedMesh
		this.createMesh = createThreeMesh
	}

	ThreeMeshPlugin.prototype = Object.create(AbstractThreeMeshPlugin.prototype)

	ThreeMeshPlugin.prototype.update_input = function (slot, data) {
		AbstractThreeMeshPlugin.prototype.update_input.apply(this, arguments)

		if (slot.name === 'object3d' && data && this.object3d !== data) {
			this.object3d = data
			this.geoms = []
			this.mats = []
		}
	}

	ThreeMeshPlugin.prototype.update_state = function () {
		AbstractThreeMeshPlugin.prototype.update_state.apply(this)

		var delta = this.core.delta_t * 0.001

		if (this.object3d) {
			this.object3d.traverse(function(n) {
				if (n instanceof THREE.MorphAnimMesh) {
					n.updateAnimation(delta)
				}
			})
		}
	}

})()

