function ThreeObject3DPlugin(core) {
	this.desc = 'THREE.js Object3D'

	Plugin.apply(this, arguments)
	
	this.input_slots = [
		{ name: 'position', dt: core.datatypes.VECTOR },
		{ name: 'rotation', dt: core.datatypes.VECTOR },
		{ name: 'scale', dt: core.datatypes.VECTOR },

		{ name: 'matrix', dt: core.datatypes.MATRIX },
		{ name: 'quaternion', dt: core.datatypes.QUATERNION },

		{ name: 'castShadow', dt: core.datatypes.BOOL },
	]

	this.output_slots = [{
		name: 'object3d',
		dt: core.datatypes.OBJECT3D
	}]

	this.state = {}
}

ThreeObject3DPlugin.prototype = Object.create(Plugin.prototype)

ThreeObject3DPlugin.prototype.reset = function() {
	console.log('reset o3d')
	this.object3d = new THREE.Object3D()
}

ThreeObject3DPlugin.prototype.update_input = function(slot, data) {
	if (!this.object3d)
		return;

	var that = this

	var handlers = [
		function() { that.object3d.position.set(data.x, data.y, data.z)},
		function() { that.object3d.rotation.set(data.x, data.y, data.z) },
		function() { that.object3d.scale.set(data.x, data.y, data.z) },
		function() { that.object3d.matrix = data },
		function() { that.object3d.quaternion = data },
		function() { that.object3d.castShadow = data }
	]

	var slotOffset = this.node.plugin.input_slots.length - handlers.length
	var adjSlotIndex = slot.index - slotOffset

	if (handlers[adjSlotIndex])
		handlers[adjSlotIndex]()
}

ThreeObject3DPlugin.prototype.update_output = function() {
	return this.object3d
}

ThreeObject3DPlugin.prototype.state_changed = function() {}

