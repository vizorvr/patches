function ThreeObject3DPlugin(core) {
	Plugin.apply(this, arguments)

	this.desc = 'THREE.js Object3D'

	this.input_slots = [
		{ name: 'position', dt: core.datatypes.VECTOR },
		{ name: 'rotation', dt: core.datatypes.VECTOR },
		{ name: 'scale', dt: core.datatypes.VECTOR },

		{ name: 'visible', dt: core.datatypes.BOOL, def: true },
		{ name: 'castShadow', dt: core.datatypes.BOOL },
		{ name: 'receiveShadow', dt: core.datatypes.BOOL },
	]

	this.output_slots = [{
		name: 'object3d',
		dt: core.datatypes.OBJECT3D
	}]
}

ThreeObject3DPlugin.prototype = Object.create(Plugin.prototype)

ThreeObject3DPlugin.prototype.reset = function() {
	Plugin.prototype.reset.apply(this, arguments)

	if (!this.object3d)
		this.object3d = new THREE.Object3D()
}

ThreeObject3DPlugin.prototype.update_input = function(slot, data) {
	if (!this.object3d)
		return;

	this.inputValues[slot.name] = data

	var that = this

	var handlers = [
		function() { that.object3d.position.set(data.x, data.y, data.z)},
		function() { that.object3d.rotation.set(data.x, data.y, data.z) },
		function() { that.object3d.scale.set(data.x, data.y, data.z) },
		function() { that.object3d.visible = data },
		function() { that.object3d.castShadow = data },
		function() { that.object3d.receiveShadow = data }
	]

	var slotOffset = this.node.plugin.input_slots.length - handlers.length
	var adjSlotIndex = slot.index - slotOffset

	if (handlers[adjSlotIndex])
		handlers[adjSlotIndex]()
	else
		this.object3d[slot.name] = data
}

ThreeObject3DPlugin.prototype.update_output = function() {
	return this.object3d
}

ThreeObject3DPlugin.prototype.state_changed = function() {}

