function WorldEditorRadialHelper() {

	var EditorGridHelper = function ( first, last, step ) {

		var size = last

		var geometry = new THREE.Geometry()
		var material =
			new THREE.LineBasicMaterial(
				{ vertexColors: THREE.VertexColors, linewidth: 1, fog: false } )

		this.color1 = new THREE.Color( 0xBBBBBB )
		this.color2 = new THREE.Color( 0x888888 )

		geometry.vertices.push(
			new THREE.Vector3( - size, 0, 0 ), new THREE.Vector3( size, 0, 0 ),
			new THREE.Vector3( 0, 0, - size ), new THREE.Vector3( 0, 0, size ))

		var color = this.color1

		geometry.colors.push( color, color, color, color )

		var segments = 100

		for ( var j = first; j <= last; j += step ) {
			var scale = j

			for (var i = 0; i < segments + 1; ++i) {
				var f1 = i / segments
				var f2 = (i + 1) / segments

				var x1 = Math.sin(f1 * Math.PI * 2) * scale
				var z1 = Math.cos(f1 * Math.PI * 2) * scale

				var x2 = Math.sin(f2 * Math.PI * 2) * scale
				var z2 = Math.cos(f2 * Math.PI * 2) * scale

				geometry.vertices.push(
				new THREE.Vector3(x1, 0, z1), new THREE.Vector3(x2, 0, z2))

				var color = this.color2

				geometry.colors.push(color, color)
			}
		}

		THREE.LineSegments.call( this, geometry, material )

	};

	EditorGridHelper.prototype = Object.create( THREE.LineSegments.prototype )
	EditorGridHelper.prototype.constructor = THREE.GridHelper

	this.mesh = new EditorGridHelper(2, 10, 1)
	this.mesh.add(new EditorGridHelper(0.2, 1, 0.1))

	var textRadius = [0.2, 0.4, 0.6, 0.8, 1, 2, 4, 6, 8, 10]

	var that = this

	var fontLoader = new THREE.FontLoader()
	fontLoader.load("/data/fonts/helvetiker_regular.typeface.js", function(font) {
		that.font = font
		var emptyTextShape = font.generateShapes("")

		var rotateNinetyDegrees = new THREE.Euler(-Math.PI / 2, 0, 0)

		that.textMeshes = []

		for (var i = 0; i < textRadius.length; ++i) {
			var textGeometry = new THREE.ShapeGeometry(emptyTextShape)
			var textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({
				color: that.mesh.color1,
				fog: false
			}))

			var scale = textRadius[i] < 1 ? 0.0001 : 0.001

			textMesh.scale.set(scale, scale, scale)
			textMesh.position.set(textRadius[i], 0, 0)
			textMesh.quaternion.setFromEuler(rotateNinetyDegrees)
			that.textMeshes.push({mesh: textMesh, radius: textRadius[i]})
			that.mesh.add(textMesh)
		}
	})

	this.gridScale = 0
	this.scale(1)
}

WorldEditorRadialHelper.prototype.scale = function(s) {
	if (s !== this.gridScale) {
		if (this.textMeshes) {
			for (var i = 0; i < this.textMeshes.length; ++i) {
				var rad = this.textMeshes[i].radius * s
				var str = rad < 1.0 ? (Math.round((rad * 100)) + " cm") : ((rad) + " m")
				var textShape = this.font.generateShapes(str)
				this.textMeshes[i].mesh.geometry = new THREE.ShapeGeometry(textShape)
			}
		}

		this.gridScale = s
		this.mesh.scale.set(s, s, s)
	}
}

WorldEditorRadialHelper.prototype.position = function(pos) {
	this.mesh.position.x = pos.x
	this.mesh.position.y = 0
	this.mesh.position.z = pos.z
}
