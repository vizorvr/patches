(function() {
	var ThreeCircleGeometryPlugin = E2.plugins.three_geometry_circle = function(core) {
		this.desc = 'THREE.js Circle Geometry'
		
		this.input_slots = [
			{ name: 'radius', dt: core.datatypes.FLOAT, def: 5 },
			{ name: 'segments', dt: core.datatypes.FLOAT, def: 8,
				validate: function(v) {return Math.max(0, Math.min(v, 100))} },
			{ name: 'thetaStart', dt: core.datatypes.FLOAT, def: 0, desc: 'Vertical starting angle' },
			{ name: 'thetaLength', dt: core.datatypes.FLOAT, def: 2 * Math.PI, desc: 'Vertical sweep angle size' },
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
		var geom = new THREE.CircleGeometry(
			this.inputValues.radius,
			this.inputValues.segments,
			this.inputValues.thetaStart,
			this.inputValues.thetaLength
		)
		return new THREE.BufferGeometry().fromGeometry(geom)
	}

	ThreeCircleGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreeCircleGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

