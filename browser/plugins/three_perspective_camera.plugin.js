(function() {
	var ThreePerspectiveCameraPlugin = E2.plugins.three_perspective_camera = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Perspective Camera'
		
		this.input_slots = [
			{ name: 'fov', dt: core.datatypes.FLOAT, def: 45.0 },
			{ name: 'aspectRatio',
				dt: core.datatypes.FLOAT,
				def: 1.0
			},
			{ name: 'near', dt: core.datatypes.FLOAT, def: 1.0 },
			{ name: 'far', dt: core.datatypes.FLOAT, def: 1000.0 },
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'camera',
			dt: core.datatypes.CAMERA
		}]
	}

	ThreePerspectiveCameraPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreePerspectiveCameraPlugin.prototype.reset = function() {
		console.log('reset camera')
		this.object3d = new THREE.PerspectiveCamera(
			45,
			window.innerWidth/window.innerHeight,
			0.1,
			1000
		);

		this.object3d.position.z = -5
	}

	ThreePerspectiveCameraPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0:
				this.object3d.fov = data
				break;
			case 1:
				this.object3d.aspectRatio = data
				break;
			case 2: 
				this.object3d.near = data
				break;
			case 3:
				this.object3d.far = data
				break;
			default:
				return ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
		}
	}

})()

