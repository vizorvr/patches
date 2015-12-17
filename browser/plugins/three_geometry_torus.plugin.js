(function() {
	var ThreeTorusGeometryPlugin = E2.plugins.three_geometry_torus = function(core) {
		this.desc = 'THREE.js Torus Geometry'

		this.input_slots = [{
			name: 'radius',
			dt: core.datatypes.FLOAT,
			def: 100
		},
		{
			name: 'tube',
			dt: core.datatypes.FLOAT,
			def: 40
		},
		{
			name: 'radialSegments',
			dt: core.datatypes.FLOAT,
			def: 8
		},
		{
			name: 'tubularSegments',
			dt: core.datatypes.FLOAT,
			def: 6
		},
		{
			name: 'arc',
			dt: core.datatypes.FLOAT,
			def: Math.PI * 2
		}]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]

		this.subdivisions = 1

		this.parameters = {
			radius: 100,
			tube: 40,
			radialSegments: 8,
			tubularSegments: 6,
			arc: Math.PI * 2
		}

		this.geometryDirty = true
	}

	ThreeTorusGeometryPlugin.prototype.generateGeometry = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(
			new THREE.TorusGeometry(
				this.parameters.radius,
				this.parameters.tube,
				this.parameters.radialSegments,
				this.parameters.tubularSegments,
				this.parameters.arc))

		this.geometryDirty = false
	}

	ThreeTorusGeometryPlugin.prototype.reset = function() {
	}

	ThreeTorusGeometryPlugin.prototype.update_input = function(slot, data) {
		if (this.parameters[slot.name] !== data) {
			this.parameters[slot.name] = data

			this.geometryDirty = true
		}
	}

	ThreeTorusGeometryPlugin.prototype.update_state = function() {
		if (this.geometryDirty) {
			this.generateGeometry()
		}
	}

	ThreeTorusGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

