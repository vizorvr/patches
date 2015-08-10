(function() {
	var ThreePerspectiveCameraPlugin = E2.plugins.three_perspective_camera = function(core) {
		this.desc = 'THREE.js Perspective Camera'
		
		this.input_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'fov', dt: core.datatypes.FLOAT, def: 45.0 },
			{
				name: 'aspectRatio',
				dt: core.datatypes.FLOAT,
				def: 1.0
			},
			{ name: 'near', dt: core.datatypes.FLOAT, def: 1.0 },
			{ name: 'far', dt: core.datatypes.FLOAT, def: 1000.0 },
		]

		this.output_slots = [{
			name: 'camera',
			dt: core.datatypes.CAMERA
		}]
	}

	ThreePerspectiveCameraPlugin.prototype.reset = function() {
		console.log('reset camera')
		this.camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth/window.innerHeight,
			0.1,
			1000
		);
	}

	ThreePerspectiveCameraPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0:
				this.camera.position.x = data[0]
				this.camera.position.y = data[1]
				this.camera.position.z = data[2]
				break;
			case 1:
				this.camera.fov = data
				break;
			case 2:
				this.camera.aspectRatio = data
				break;
			case 3: 
				this.camera.near = data
				break;
			case 4:
				this.camera.far = data
				break;
		}
	}

	ThreePerspectiveCameraPlugin.prototype.update_output = function() {
		return this.camera
	}

	ThreePerspectiveCameraPlugin.prototype.state_changed = function() {
	}

})()

