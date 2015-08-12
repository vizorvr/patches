(function() {
	var ThreeCircleGeometryPlugin = E2.plugins.three_geometry_circle = function(core) {
		this.desc = 'THREE.js Circle Geometry'
		
		this.input_slots = [
			{ name: 'radius', dt: core.datatypes.FLOAT, def: 5 },
			{ name: 'segments', dt: core.datatypes.FLOAT, def: 8 },
			{ name: 'thetaStart', dt: core.datatypes.FLOAT, def: 0 },
			{ name: 'thetaLength', dt: core.datatypes.FLOAT, def: 2 * Math.PI },
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeCircleGeometryPlugin.prototype.reset = function() {
		Plugin.prototype.reset.call(this)
		this.geometry = this.createGeometry()
	}

	ThreeCircleGeometryPlugin.prototype.createGeometry = function() {
		return new THREE.CircleGeometry(
			this.inputValues.radius,
			this.inputValues.segments,
			this.inputValues.thetaStart,
			this.inputValues.thetaLength
		)
	}

	ThreeCircleGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreeCircleGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

