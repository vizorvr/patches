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

		this.desc = 'THREE.js Mesh'

		this.createMeshRoot = createThreeMeshRoot
		this.createAnimatedMesh = createThreeAnimatedMesh
		this.createMesh = createThreeMesh
	}

	ThreeMeshPlugin.prototype = Object.create(AbstractThreeMeshPlugin.prototype)

	ThreeMeshPlugin.prototype.update_state = function () {
		AbstractThreeMeshPlugin.prototype.update_state.apply(this)

		var delta = this.core.delta_t
		for(var i = 0; i < this.object3d.children.length; ++i) {
			if (this.object3d.children[i] instanceof THREE.MorphAnimMesh) {
				this.object3d.children[i].updateAnimation(delta * 1000)
			}
		}
	}

})()

