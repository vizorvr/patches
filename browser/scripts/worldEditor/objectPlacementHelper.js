function AbstractObjectPlacementHelper() {
}

AbstractObjectPlacementHelper.prototype = {
	execute: function(plugin) {
		// place in front of current camera if we're in VR view
		if (E2.app.worldEditor.isVRCamera()) {
			var cam = E2.app.worldEditor.getCamera()
			var worldPos = new THREE.Vector3(0, 0, -2)
			worldPos.applyMatrix4(cam.matrixWorld)

			var oldPos = new THREE.Vector3(plugin.state.position.x, plugin.state.position.y, plugin.state.position.z)
			plugin.undoableSetState('position', worldPos, oldPos)
		}
	}
}

// Objects
function ObjectPlacementHelper() {
	AbstractObjectPlacementHelper.apply(this, arguments)
}

ObjectPlacementHelper.prototype = Object.create(AbstractObjectPlacementHelper.prototype)

ObjectPlacementHelper.prototype.execute = function(plugin) {
	// scale to unit size
	plugin.scaleToUnitSize()

	AbstractObjectPlacementHelper.prototype.execute.apply(this, arguments)
}

// Textures
function TexturePlacementHelper() {
	AbstractObjectPlacementHelper.apply(this, arguments)
}

TexturePlacementHelper.prototype = Object.create(AbstractObjectPlacementHelper.prototype)

TexturePlacementHelper.prototype.execute = function(plugin) {
	AbstractObjectPlacementHelper.prototype.execute.apply(this, arguments)
}
