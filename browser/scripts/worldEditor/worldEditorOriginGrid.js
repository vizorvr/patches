function WorldEditorOriginGrid() {

	var EditorGridHelper = function ( size, step ) {
		this.color1 = new THREE.Color( 0xBBBBBB )
		this.color2 = new THREE.Color( 0x888888 )

		var lineMaterial =
			new THREE.LineBasicMaterial(
				{ vertexColors: THREE.VertexColors, linewidth: 1, fog: false } )

		var geometry = new THREE.Geometry()


		for ( var i = - size; i <= size; i += step ) {

			geometry.vertices.push(
				new THREE.Vector3( - size, 0, i ), new THREE.Vector3( size, 0, i ),
				new THREE.Vector3( i, 0, - size ), new THREE.Vector3( i, 0, size ))

			var color = Math.abs(i) < (step / 2) ? this.color1 : this.color2

			geometry.colors.push( color, color, color, color )
		}

		THREE.LineSegments.call( this, geometry, lineMaterial )

	};

	EditorGridHelper.prototype = Object.create( THREE.LineSegments.prototype )
	EditorGridHelper.prototype.constructor = THREE.GridHelper

	this.mesh = new EditorGridHelper(10, 1)
	this.mesh.add(new EditorGridHelper(1, 0.1))

	var that = this

	var fontLoader = new THREE.FontLoader()
	fontLoader.load("/data/fonts/helvetiker_regular.typeface.js", function(font) {
		that.font = font
		
		var textShapes = font.generateShapes("")
		var text1 = new THREE.ShapeGeometry(textShapes)
		that.textMesh1 = new THREE.Mesh(text1, new THREE.MeshBasicMaterial({color: that.mesh.color1, fog: false}))
		that.textMesh1.scale.set(0.001, 0.001, 0.001)
		that.textMesh1.position.set(1, 0, -1)
		that.textMesh1.quaternion.setFromEuler(new THREE.Euler(-3.14159/2,0,0))
		that.mesh.add(this.textMesh1)

		var text2 = new THREE.ShapeGeometry(textShapes)
		that.textMesh2 = new THREE.Mesh(text2, new THREE.MeshBasicMaterial({color: that.mesh.color1, fog: false}))
		that.textMesh2.scale.set(0.002, 0.002, 0.002)
		that.textMesh2.position.set(10, 0, -10)
		that.textMesh2.quaternion.setFromEuler(new THREE.Euler(-3.14159/2,0,0))
		that.mesh.add(that.textMesh2)
	})

	this.gridScale = 0
	this.scale(1)
}

WorldEditorOriginGrid.prototype.scale = function(s) {
	if (s !== this.gridScale) {
		if (this.textMesh1) {
			var textShapes = this.font.generateShapes(s.toString() + " m")
			this.textMesh1.geometry = new THREE.ShapeGeometry(textShapes)
		}

		if (this.textMesh2) {
			textShapes = this.font.generateShapes((s * 10).toString() + " m")
			this.textMesh2.geometry = new THREE.ShapeGeometry(textShapes)
		}

		this.gridScale = s
		this.mesh.scale.set(s, s, s)
	}
}


