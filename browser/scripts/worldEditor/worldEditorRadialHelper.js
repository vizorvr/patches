function WorldEditorRadialHelper() {
	/**
	 * @author mrdoob / http://mrdoob.com/
	 */

	var EditorGridHelper = function ( size, step ) {

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

		var segments = 30

		for ( var j = 0; j <= size; j += step ) {
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

	EditorGridHelper.prototype.setColors = function( colorCenterLine, colorGrid ) {

		this.color1.set( colorCenterLine )
		this.color2.set( colorGrid )

		this.geometry.colorsNeedUpdate = true

	};

	this.mesh = new EditorGridHelper(10, 1)
	this.mesh.add(new EditorGridHelper(1, 0.1))

	//for ()

	var textShapes = THREE.FontUtils.generateShapes("")
	var text = new THREE.ShapeGeometry(textShapes)
	this.textMesh = new THREE.Mesh(text, new THREE.MeshBasicMaterial({color: this.mesh.color1, fog: false}))
	this.textMesh.scale.set(0.001, 0.001, 0.001)
	this.textMesh.position.set(1, 0, 0)
	this.textMesh.quaternion.setFromEuler(new THREE.Euler(-3.14159/2,0,0))
	this.mesh.add(this.textMesh)

	this.gridScale = 0
	this.scale(1)
}

WorldEditorRadialHelper.prototype.scale = function(s) {
	if (s !== this.gridScale) {
		var textShapes = THREE.FontUtils.generateShapes(s.toString() + " m")
		this.textMesh.geometry = new THREE.ShapeGeometry(textShapes)

		this.gridScale = s
		this.mesh.scale.set(s, s, s)
	}
}

WorldEditorRadialHelper.prototype.position = function(pos) {
	this.mesh.position.copy(pos)
}
