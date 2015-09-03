(function() {
	var ThreeSphereGeometryPlugin = E2.plugins.three_geometry_sphere = function(core) {
		this.desc = 'THREE.js Sphere Geometry'

		this.input_slots = [
			{
				name: 'radius',
				dt: core.datatypes.FLOAT,
				def: 50
			},
			{
				name: 'widthSegments',
				dt: core.datatypes.FLOAT,
				def: 8,
				desc: 'Number of horizontal segments',
				validate: function(v) {return Math.max(0, Math.min(v, 50))}
			},
			{
				name: 'heightSegments',
				dt: core.datatypes.FLOAT,
				def: 6,
				desc: 'Number of vertical segments',
				validate: function(v) {return Math.max(0, Math.min(v, 50))}
			},
			{
				name: 'phiStart',
				dt: core.datatypes.FLOAT,
				def: 0, desc: 'Horizontal starting angle'
			},
			{
				name: 'phiLength',
				dt: core.datatypes.FLOAT,
				def: 2 * Math.PI, desc: 'Horizontal sweep angle size'
			},
			{
				name: 'thetaStart',
				dt: core.datatypes.FLOAT,
				def: 0, desc: 'Vertical starting angle'
			},
			{
				name: 'thetaLength',
				dt: core.datatypes.FLOAT,
				def: Math.PI,
				desc: 'Vertical sweep angle size'
			}
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeSphereGeometryPlugin.prototype.reset = function() {
		Plugin.prototype.reset.call(this)
		this.geometry = this.createGeometry()
	}

	ThreeSphereGeometryPlugin.prototype.createGeometry = function() {
		return new THREE.SphereGeometry(
			this.inputValues.radius,
			Math.floor(this.inputValues.widthSegments),
			Math.floor(this.inputValues.heightSegments),
			this.inputValues.phiStart,
			this.inputValues.phiLength,
			this.inputValues.thetaStart,
			this.inputValues.thetaLength
		)
	}

	ThreeSphereGeometryPlugin.prototype.update_input = function() {
		Plugin.prototype.update_input.apply(this, arguments)
		this.geometry = this.createGeometry()
	}

	ThreeSphereGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

