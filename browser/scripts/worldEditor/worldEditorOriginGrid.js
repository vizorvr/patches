function WorldEditorOriginGrid() {
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

		for ( var i = - size; i <= size; i += step ) {

			geometry.vertices.push(
				new THREE.Vector3( - size, 0, i ), new THREE.Vector3( size, 0, i ),
				new THREE.Vector3( i, 0, - size ), new THREE.Vector3( i, 0, size ))

			var color = Math.abs(i) < (step / 2) ? this.color1 : this.color2

			geometry.colors.push( color, color, color, color )
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
}

WorldEditorOriginGrid.prototype.scale = function(s) {
	this.mesh.scale.set(s, s, s)
}


