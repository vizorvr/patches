function BoundingBoxHelper() {
	THREE.BoundingBoxHelper.apply(this)

	this.material.opacity = 0.3
	this.material.transparent = true
	this.material.wireframe = false
	this.material.color = new THREE.Color(0x9900ff)

	this.attach = function (obj) {
		this.object = obj
		this.updateTransform()
	}

	this.detach = function () {
		this.object = undefined
	}
	
	this.updateTransform = function() {
		if (!this.object)
			return;

		this.update()
	}
}

BoundingBoxHelper.prototype = Object.create(THREE.BoundingBoxHelper.prototype)
BoundingBoxHelper.prototype.constructor = BoundingBoxHelper
