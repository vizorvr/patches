(function() {
	var ThreeRingGeometryPlugin = E2.plugins.three_geometry_ring = function(core) {
		Plugin.apply(this, arguments)

		this.desc = 'THREE.js Ring Geometry'

		this.input_slots = [{
			name: 'innerRadius',
			dt: core.datatypes.FLOAT,
			def: 0
		},
		{
			name: 'outerRadius',
			dt: core.datatypes.FLOAT,
			def: 1
		},
		{
			name: 'thetaSegments',
			dt: core.datatypes.FLOAT,
			def: 8
		},
		{
			name: 'phiSegments',
			dt: core.datatypes.FLOAT,
			def: 8
		},
		{
			name: 'thetaStart',
			dt: core.datatypes.FLOAT,
			def: 0
		},
		{
			name: 'thetaLength',
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

	ThreeRingGeometryPlugin.prototype = Object.create(Plugin.prototype)

	ThreeRingGeometryPlugin.prototype.generateGeometry = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(
		new THREE.RingGeometry(
			this.inputValues.innerRadius,
			this.inputValues.outerRadius,
			this.inputValues.thetaSegments,
			this.inputValues.phiSegments,
			this.inputValues.thetaStart,
			this.inputValues.thetaLength))

		this.geometryDirty = false
	}

	ThreeRingGeometryPlugin.prototype.update_input = function(slot, data) {
		if (this.inputValues[slot.name] !== data) {
			this.geometryDirty = true
		}

		Plugin.prototype.update_input.apply(this, arguments)
	}

	ThreeRingGeometryPlugin.prototype.update_state = function() {
		if (this.geometryDirty) {
			this.generateGeometry()
		}
	}

	ThreeRingGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

