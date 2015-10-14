(function() {
	var ThreeBoxGeometryPlugin = E2.plugins.three_geometry_box = function(core) {
		this.desc = 'THREE.js Box Geometry'
		
		this.input_slots = [{
			name: 'subdivisions',
			dt: core.datatypes.FLOAT,
			def: 1,
			validate: function(v) {return Math.max(0, Math.min(v, 50))}
		}]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]

		this.subdivisions = 1
	}

	ThreeBoxGeometryPlugin.prototype.reset = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 1, this.subdivisions, this.subdivisions, this.subdivisions))
	}

	ThreeBoxGeometryPlugin.prototype.update_input = function(slot, data) {
		if (this.subdivisions !== data) {
			this.subdivisions = data
			this.geometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 1, this.subdivisions,this.subdivisions,this.subdivisions))
		}
	}

	ThreeBoxGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

