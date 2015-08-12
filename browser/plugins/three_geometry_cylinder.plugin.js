(function() {
	var ThreeCylinderGeometryPlugin = E2.plugins.three_geometry_cylinder = function(core) {
		this.desc = 'THREE.js Cylinder Geometry'
		
		this.input_slots = [
			{ name: 'radiusTop', dt: core.datatypes.FLOAT, def: 20 },
			{ name: 'radiusBottom', dt: core.datatypes.FLOAT, def: 20 },
			{ name: 'height', dt: core.datatypes.FLOAT, def: 100 },
			{ name: 'radiusSegments', dt: core.datatypes.FLOAT, def: 8 },
			{ name: 'heightSegments', dt: core.datatypes.FLOAT, def: 1 },
			{ name: 'openEnded', dt: core.datatypes.BOOL, def: false },
			{ name: 'thetaStart', dt: core.datatypes.FLOAT, def: 0 },
			{ name: 'thetaLength', dt: core.datatypes.FLOAT, def: 2 * Math.PI },
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeCylinderGeometryPlugin.prototype.reset = function() {
		Plugin.prototype.reset.call(this)
		this.geometry = this.createGeometry()
	}

	ThreeCylinderGeometryPlugin.prototype.createGeometry = function() {
		return new THREE.CylinderGeometry(
			this.inputValues.radiusTop,
			this.inputValues.radiusBottom,
			this.inputValues.height,
			Math.floor(this.inputValues.radiusSegments),
			Math.floor(this.inputValues.heightSegments),
			this.inputValues.openEnded,
			this.inputValues.thetaStart,
			this.inputValues.thetaLength
		)
	}

	ThreeCylinderGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreeCylinderGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

