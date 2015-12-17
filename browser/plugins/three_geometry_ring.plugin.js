(function() {
	var ThreeRingGeometryPlugin = E2.plugins.three_geometry_ring = function(core) {
		this.desc = 'THREE.js Ring Geometry'

		this.input_slots = [{
			name: 'innerRadius',
			dt: core.datatypes.FLOAT,
			def: 0
		},
		{
			name: 'outerRadius',
			dt: core.datatypes.FLOAT,
			def: 50
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

		this.parameters = {
			innerRadius: 0,
			outerRadius: 50,
			thetaSegments: 8,
			phiSegments: 8,
			thetaStart: 0,
			thetaLenght: Math.PI * 2
		}

		this.geometryDirty = true
	}

	ThreeRingGeometryPlugin.prototype.generateGeometry = function() {
		this.geometry = new THREE.BufferGeometry().fromGeometry(
		new THREE.RingGeometry(
			this.parameters.innerRadius,
			this.parameters.outerRadius,
			this.parameters.thetaSegments,
			this.parameters.phiSegments,
			this.parameters.thetaStart,
			this.parameters.thetaLength))

		this.geometryDirty = false
	}

	ThreeRingGeometryPlugin.prototype.reset = function() {
	}

	ThreeRingGeometryPlugin.prototype.update_input = function(slot, data) {
		if (this.parameters[slot.name] !== data) {
			this.parameters[slot.name] = data

			this.geometryDirty = true
		}
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

