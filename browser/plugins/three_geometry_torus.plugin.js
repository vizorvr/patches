(function() {
	var ThreeTorusGeometryPlugin = E2.plugins.three_geometry_torus = function(core) {
		Plugin.apply(this, arguments)

		this.desc = 'THREE.js Torus Geometry'

		this.input_slots = [{
			name: 'radius',
			dt: core.datatypes.FLOAT,
			def: 1
		},
		{
			name: 'tube',
			dt: core.datatypes.FLOAT,
			def: 0.4
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

		this.geometryDirty = true
	}

	ThreeTorusGeometryPlugin.prototype = Object.create(Plugin.prototype)

	ThreeTorusGeometryPlugin.prototype.generateGeometry = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(
			new THREE.TorusGeometry(
				this.inputValues.radius,
				this.inputValues.tube,
				Math.floor(this.inputValues.radialSegments),
				Math.floor(this.inputValues.tubularSegments),
				this.inputValues.arc))

		this.geometryDirty = false
	}

	ThreeTorusGeometryPlugin.prototype.update_input = function(slot, data) {
		this.geometryDirty = true

		Plugin.prototype.update_input.apply(this, arguments)
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

