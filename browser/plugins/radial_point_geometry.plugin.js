(function() {
	var RadialPointGeometry = E2.plugins.radial_point_geometry = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [ {
			name: 'point count',
			dt: E2.dt.FLOAT,
			def: 36
		},
		{
			name: 'sectors',
			dt: E2.dt.FLOAT,
			def: 6
		}, {
			name: 'depth',
			dt: E2.dt.FLOAT,
			def: 6
		}, {
			name: 'distance',
			dt: E2.dt.FLOAT,
			def: 1
		}, {
			name: 'spacing',
			dt: E2.dt.FLOAT,
			def: 0.25
		}]

		this.output_slots = [{
			name: 'geometry',
			dt: E2.dt.GEOMETRY
		}]
	}

	RadialPointGeometry.prototype = Object.create(Plugin.prototype)

	RadialPointGeometry.prototype.update_input = function(slot, data) {
		this.updated = true
	}

	RadialPointGeometry.prototype.update_state = function() {
		// ideally we'd reuse the geometry, however for now
		// this geometry can't be used inside an array_function
		// unless we regenerate the geometry in update_state()
		this.geometry = new THREE.Geometry()

		var dotsPerLayer = this.inputValues.sectors * this.inputValues.depth

		for (var i = 0, len = this.inputValues['point count']; i < len; ++i) {
			var angle = (i % dotsPerLayer) / this.inputValues.sectors * Math.PI * 2

			var layer1 = Math.floor((i % dotsPerLayer) / this.inputValues.sectors)

			var layer2 = Math.floor(i / dotsPerLayer)

			var d = this.inputValues.distance + (this.inputValues.spacing * layer1)
			var h = layer2 * this.inputValues.spacing

			var x = Math.cos(angle) * d
			var y = -Math.sin(angle) * d
			var z = h
			var p = new THREE.Vector3(x, y, z)

			this.geometry.vertices.push(p)
		}
	}

	RadialPointGeometry.prototype.update_output = function() {
		return this.geometry
	}
})()