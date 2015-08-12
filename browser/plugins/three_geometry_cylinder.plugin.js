(function() {
	var ThreeCylinderGeometryPlugin = E2.plugins.three_geometry_cylinder = function(core) {
		this.desc = 'THREE.js Cylinder Geometry'
		
		this.input_slots = [
			{ name: 'radiusTop', dt: core.datatypes.FLOAT },
			{ name: 'radiusBottom', dt: core.datatypes.FLOAT },
			{ name: 'height', dt: core.datatypes.FLOAT },
			{ name: 'radiusSegments', dt: core.datatypes.FLOAT },
			{ name: 'heightSegments', dt: core.datatypes.FLOAT },
			{ name: 'openEnded', dt: core.datatypes.BOOL },
			{ name: 'thetaStart', dt: core.datatypes.FLOAT },
			{ name: 'thetaLength', dt: core.datatypes.FLOAT },
		]

		this.output_slots = [{
			name: 'geometry',
			dt: core.datatypes.GEOMETRY
		}]
	}

	ThreeCylinderGeometryPlugin.prototype.reset = function() {
		this.radiusTop = 20
		this.radiusBottom = 20
		this.height = 100
		this.radiusSegments = 8
		this.heightSegments = 1
		this.openEnded = false
		this.thetaStart = 0
		this.thetaLength = 2 * Math.PI
		this.geometry = this.createGeometry()
	}

	ThreeCylinderGeometryPlugin.prototype.createGeometry = function() {
		return new THREE.CylinderGeometry(
			this.radiusTop,
			this.radiusBottom,
			this.height,
			Math.floor(this.radiusSegments),
			Math.floor(this.heightSegments),
			this.openEnded,
			this.thetaStart,
			this.thetaLength
		)
	}

	ThreeCylinderGeometryPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0: this.radiusTop = data; break;
			case 1: this.radiusBottom = data; break;
			case 2: this.height = data; break;
			case 3: this.radiusSegments = data; break;
			case 4: this.heightSegments = data; break;
			case 5: this.openEnded = data; break;
			case 6: this.thetaStart = data; break;
			case 7: this.thetaLength = data; break;
		}

		this.geometry = this.createGeometry()
	}

	ThreeCylinderGeometryPlugin.prototype.update_output = function() {
		return this.geometry
	}

})()

