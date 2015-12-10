function VRCameraHelper( camera ) {
	function VRCameraGeometry() {
		THREE.Geometry.call(this)

		var hdetail = 8
		var vdetail = 2

		var size = 0.1

		var hmdHalfProportion = 0.2

		// generate a distorted torus which resembles a hmd
		var i, j
		for (j = 0; j < hdetail; ++j) {
			for (i = 0; i < vdetail; ++i) {
				var fi = i / (vdetail - 1)
				var fj = j / hdetail

				var fj2 = 1
				if (fj > 1.0 - hmdHalfProportion) {
					fj2 = (1.0 - fj) / hmdHalfProportion
				}
				else if (fj < hmdHalfProportion) {
					fj2 = fj / hmdHalfProportion
				}

				var hmdScale = 0.25
				var extrudeScale = 1.05

				if (fj2 < 1.0) {
					hmdScale = 1
					extrudeScale = 1.3 + fj2 * 0.6
				}

				var x = Math.sin(fj * 3.14159 * 2) * size
				var y = (fi - 0.5) * hmdScale * size
				var z = size - Math.cos(fj * 3.14159 * 2) * size

				this.vertices.push(new THREE.Vector3(x, y, z))

				x *= extrudeScale
				z *= extrudeScale

				this.vertices.push(new THREE.Vector3(x, y, z))
			}
		}

		var a
		var b
		var c
		var d
		var normal
		var face

		for (j = 0; j < hdetail; ++j) {
			for (i = 0; i < vdetail - 1; ++i) {
				var fj = j / hdetail

				// inside
				a = (j * vdetail + i + 1) * 2
				b = (j * vdetail + i) * 2
				c = (((j + 1) % hdetail * vdetail) + i + 1) * 2
				d = (((j + 1) % hdetail * vdetail) + i) * 2

				normal = new THREE.Vector3(-Math.sin(fj * 3.14159 * 2), 0, Math.cos(fj * 3.14159 * 2))
				face = new THREE.Face3(a, b, c)
				face.normal = normal
				this.faces.push(face)

				face = new THREE.Face3(b, d, c)
				face.normal = normal.clone()
				this.faces.push(face)

				// outside
				a = (j * vdetail + i) * 2 + 1
				b = (j * vdetail + i + 1) * 2 + 1
				c = (((j + 1) % hdetail * vdetail) + i) * 2 + 1
				d = (((j + 1) % hdetail * vdetail) + i + 1) * 2 + 1

				normal = new THREE.Vector3(Math.sin(fj * 3.14159 * 2), 0, -Math.cos(fj * 3.14159 * 2))
				face = new THREE.Face3(a, b, c)
				face.normal = normal
				this.faces.push(face)

				face = new THREE.Face3(b, d, c)
				face.normal = normal.clone()
				this.faces.push(face)

				// bottom
				a = (j * vdetail + i) * 2
				b = (j * vdetail + i) * 2 + 1
				c = (((j + 1) % hdetail * vdetail) + i) * 2
				d = (((j + 1) % hdetail * vdetail) + i) * 2 + 1

				normal = new THREE.Vector3(0, -1, 0)
				face = new THREE.Face3(a, b, c)
				face.normal = normal
				this.faces.push(face)

				face = new THREE.Face3(b, d, c)
				face.normal = normal.clone()
				this.faces.push(face)

				// top
				a = (j * vdetail + i + 1) * 2 + 1
				b = (j * vdetail + i + 1) * 2
				c = (((j + 1) % hdetail * vdetail) + i + 1) * 2 + 1
				d = (((j + 1) % hdetail * vdetail) + i + 1) * 2

				normal = new THREE.Vector3(0, 1, 0)
				face = new THREE.Face3(a, b, c)
				face.normal = normal
				this.faces.push(face)

				face = new THREE.Face3(b, d, c)
				face.normal = normal.clone()
				this.faces.push(face)
			}
		}

		this.mergeVertices()
	}

	VRCameraGeometry.prototype = Object.create(THREE.Geometry.prototype)
	VRCameraGeometry.prototype.constructor = THREE.Geometry

	this.geometry = new VRCameraGeometry()
	this.material = new THREE.MeshLambertMaterial({color: 0xffffff})
	this.material.wireframe = false

	THREE.Mesh.call(this, this.geometry, this.material)

	this.matrixAutoUpdate = false

	if (camera) {
		this.attachCamera(camera)
	}
}

VRCameraHelper.prototype = Object.create( THREE.Mesh.prototype )
VRCameraHelper.prototype.constructor = THREE.CameraHelper

VRCameraHelper.prototype.dispose = function() {
	this.geometry.dispose()
	this.material.dispose()
}

VRCameraHelper.prototype.attachCamera = function(camera) {
	this.camera = camera

	this.matrix = this.camera.matrixWorld

	this.backReference = this.camera.backReference
}
