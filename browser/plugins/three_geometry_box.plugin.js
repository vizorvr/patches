(function() {
	var ThreeBoxGeometryPlugin = E2.plugins.three_geometry_box = function(core) {
		this.desc = 'THREE.js Box Geometry'
		
		this.input_slots = []

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeBoxGeometryPlugin.prototype.reset = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1,1,1))
	}

	ThreeBoxGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

