(function() {
	var createThreeMeshRoot = function() {
		return new THREE.Object3D()
	}

	var createThreeLineSegments = function(geom, mats) {
		var pc = new THREE.LineSegments(geom, mats)
		return pc
	}

	var ThreeLineSegmentsPlugin = E2.plugins.three_line_segments = function(core) {
		AbstractThreeMeshPlugin.apply(this, arguments)

		this.desc = 'THREE.js Line Segments'

		this.createMeshRoot = createThreeMeshRoot
		this.createAnimatedMesh = createThreeLineSegments
		this.createMesh = createThreeLineSegments
	}

	ThreeLineSegmentsPlugin.prototype = Object.create(AbstractThreeMeshPlugin.prototype)

	ThreeLineSegmentsPlugin.prototype.update_input = function(slot, data) {
		AbstractThreeMeshPlugin.prototype.update_input.apply(this, arguments)
	}
})()

