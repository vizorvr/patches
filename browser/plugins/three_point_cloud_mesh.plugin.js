(function() {
	var createThreeMeshRoot = function() {
		return new THREE.Object3D()
	}

	var createThreePointCloud = function(geom, mats) {
		var pc = new THREE.PointCloud(geom, mats)
		return pc
	}

	var ThreePointCloudMeshPlugin = E2.plugins.three_point_cloud_mesh = function(core) {
		AbstractThreeMeshPlugin.apply(this, arguments)

		this.desc = 'THREE.js Point Cloud Mesh'

		this.createMeshRoot = createThreeMeshRoot
		this.createAnimatedMesh = createThreePointCloud
		this.createMesh = createThreePointCloud
	}

	ThreePointCloudMeshPlugin.prototype = Object.create(AbstractThreeMeshPlugin.prototype)

	ThreePointCloudMeshPlugin.prototype.update_input = function(slot, data) {
		if (slot.index === 1) { // material
			var enabled = data.transparent ? true : false

			if (this.sortParticles !== enabled) {
				this.object3d.traverse(function(object) {
					if (object instanceof THREE.PointCloud) {
						object.sortParticles = enabled
					}
				})

				this.sortParticles = enabled
			}
		}

		AbstractThreeMeshPlugin.prototype.update_input.apply(this, arguments)
	}
})()

