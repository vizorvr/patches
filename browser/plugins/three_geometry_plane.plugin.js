(function() {
	var ThreePlaneGeometryPlugin = E2.plugins.three_geometry_plane = function(core) {
		this.desc = 'THREE.js Plane Geometry'
		
		this.input_slots = [
			{ name: 'width', dt: core.datatypes.FLOAT, def: 5 },
			{ name: 'height', dt: core.datatypes.FLOAT, def: 5 },
			{ name: 'widthSegments', dt: core.datatypes.FLOAT, def: 1, desc: 'Number of horizontal segments' },
			{ name: 'heightSegments', dt: core.datatypes.FLOAT, def: 1, desc: 'Number of vertical segments' },
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreePlaneGeometryPlugin.prototype.reset = function() {
		Plugin.prototype.reset.call(this)
		this.geometry = this.createGeometry()
	}

	ThreePlaneGeometryPlugin.prototype.createGeometry = function() {
		return new THREE.PlaneGeometry(
			this.inputValues.width,
			this.inputValues.height,
			Math.floor(this.inputValues.widthSegments),
			Math.floor(this.inputValues.heightSegments)
		)
	}

	ThreePlaneGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreePlaneGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

