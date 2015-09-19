function ThreeObject3DPlugin(core) {
	Plugin.apply(this, arguments)

	this.desc = 'THREE.js Object3D'

	this.input_slots = [
		{ name: 'position', dt: core.datatypes.VECTOR, def: undefined },
		{ name: 'rotation', dt: core.datatypes.VECTOR, def: undefined },
		{ name: 'scale', dt: core.datatypes.VECTOR, def: undefined },

		{ name: 'visible', dt: core.datatypes.BOOL, def: true },
		{ name: 'castShadow', dt: core.datatypes.BOOL },
		{ name: 'receiveShadow', dt: core.datatypes.BOOL },
	]

	this.output_slots = [{
		name: 'object3d',
		dt: core.datatypes.OBJECT3D
	}]

	this.state = {
		position: {x: 0, y: 0, z:0},
		scale: {x: 0, y: 0, z:0},
		quaternion: {x: 0, y: 0, z:0, w:0}
	}
}

ThreeObject3DPlugin.prototype = Object.create(Plugin.prototype)

ThreeObject3DPlugin.prototype.reset = function() {
	Plugin.prototype.reset.apply(this, arguments)

	if (!this.object3d)
		this.object3d = new THREE.Object3D()

	this.object3d.scale.set(this.state.scale.x, this.state.scale.y, this.state.scale.z)
	this.object3d.position.set(this.state.position.x, this.state.position.y, this.state.position.z)
	this.object3d.quaternion.set(this.state.quaternion.x, this.state.quaternion.y, this.state.quaternion.z, this.state.quaternion.w)
}

ThreeObject3DPlugin.prototype.update_input = function(slot, data) {
	if (!this.object3d)
		return;

	this.inputValues[slot.name] = data

	var that = this

	var handlers = [
		function() {
			that.state.position.x = data.x
			that.state.position.y = data.y
			that.state.position.z = data.z
		},
		function() {
			var temp = new THREE.Quaternion().setFromEuler(new THREE.Euler(data.x, data.y, data.z))
			that.state.quaternion.x = temp.x
			that.state.quaternion.y = temp.y
			that.state.quaternion.z = temp.z
			that.state.quaternion.w = temp.w
		},
		function() {
			that.state.scale.x = data.x
			that.state.scale.y = data.y
			that.state.scale.z = data.z
		},
		function() { that.object3d.visible = data },
		function() { that.object3d.castShadow = data },
		function() { that.object3d.receiveShadow = data }
	]

	var slotOffset = this.node.plugin.input_slots.length - handlers.length
	var adjSlotIndex = slot.index - slotOffset

	if (handlers[adjSlotIndex]) {
		if (data !== undefined) {
			handlers[adjSlotIndex]()
		}
	}
	else {
		this.object3d[slot.name] = data
	}
}

ThreeObject3DPlugin.prototype.update_output = function() {
	return this.object3d
}

ThreeObject3DPlugin.prototype.state_changed = function(ui) {
	if (ui) {
		return
	}
}

ThreeObject3DPlugin.prototype.update_state = function() {
	this.object3d.scale.set(this.state.scale.x, this.state.scale.y, this.state.scale.z)
	this.object3d.position.set(this.state.position.x, this.state.position.y, this.state.position.z)
	this.object3d.quaternion.set(this.state.quaternion.x, this.state.quaternion.y, this.state.quaternion.z, this.state.quaternion.w)
}
