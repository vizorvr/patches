( function () {
	BoundingBox = function (obj) {
		THREE.BoxHelper.apply(this)

		this.attach = function (obj) {
			this.attachedObj = obj
			this.updateTransform()
		};

		this.detach = function () {
			this.attachedObj = undefined
		};
		
		this.updateTransform = function() {
			if (this.attachedObj) {
				// Call the boxHelper update method
				// to update the bounding box geometry
				this.update(this.attachedObj)
			}
		}
	};

	BoundingBox.prototype = Object.create( THREE.BoxHelper.prototype )
	BoundingBox.prototype.constructor = BoundingBox
}() );
