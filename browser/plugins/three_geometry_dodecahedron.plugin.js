(function() {
	var ThreeDodecahedronGeometryPlugin = E2.plugins.three_geometry_dodecahedron = function(core) {
		this.desc = 'THREE.js Dodecahedron Geometry'
		
		this.input_slots = [
			{   name: 'radius', dt: core.datatypes.FLOAT, def: 5 },
			{   name: 'detail', dt: core.datatypes.FLOAT, def: 2,
				validate: function(v) {return Math.max(0, Math.min(v, 4))} },
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeDodecahedronGeometryPlugin.prototype.reset = function() {
		Plugin.prototype.reset.call(this)
		this.geometry = this.createGeometry()
	}

	ThreeDodecahedronGeometryPlugin.prototype.createGeometry = function() {
		var geom = new THREE.DodecahedronGeometry(
			this.inputValues.radius,
			Math.floor(this.inputValues.detail)
		)
	
		return new THREE.BufferGeometry().fromGeometry(geom)
	}

	ThreeDodecahedronGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreeDodecahedronGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

