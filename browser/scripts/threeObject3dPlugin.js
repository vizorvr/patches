function ThreeObject3DPlugin(core) {
	Plugin.apply(this, arguments)

	this.desc = 'THREE.js Object3D'

	this.input_slots = [
		{ name: 'position', dt: core.datatypes.VECTOR },
		{ name: 'rotation', dt: core.datatypes.VECTOR },
		{ name: 'scale', dt: core.datatypes.VECTOR, def: new THREE.Vector3(1, 1, 1) },

		{ name: 'visible', dt: core.datatypes.BOOL, def: true },
		{ name: 'castShadow', dt: core.datatypes.BOOL },
		{ name: 'receiveShadow', dt: core.datatypes.BOOL },

		{ name: 'name', dt: core.datatypes.TEXT, def: ''},

		{
			name:   'stereo view',
			dt:     core.datatypes.FLOAT,
			def:    0,
			desc:   'Affects how this object is rendered in stereo<br/>Stereo View - 0: both eyes, 1: left eye only, 2: right eye only'
		}
	]

	this.output_slots = [{
		name: 'object3d',
		dt: core.datatypes.OBJECT3D
	}]

	this.state = {
		position: {x: 0, y: 0, z:0},
		scale: {x: 1, y: 1, z:1},

		// names with underscores have to match with THREE.Quaternion
		// member variable names because of to/from json serialisation
		quaternion: {_x: 0, _y: 0, _z:0, _w:1},

		pivot: {x: 0, y: 0, z:0}
	}

	this.graphInputs = {
		position: new THREE.Vector3(0, 0, 0),
		scale: new THREE.Vector3(0, 0, 0),
		quaternion: new THREE.Quaternion(0, 0, 0, 1)
	}
}

ThreeObject3DPlugin.prototype = Object.create(Plugin.prototype)

ThreeObject3DPlugin.prototype.reset = function() {
	Plugin.prototype.reset.apply(this, arguments)

	if (!this.object3d)
		this.object3d = new THREE.Object3D()

	this.object3d.scale.set(this.state.scale.x, this.state.scale.y, this.state.scale.z)
	this.object3d.position.set(this.state.position.x, this.state.position.y, this.state.position.z)
	this.object3d.quaternion.set(this.state.quaternion._x, this.state.quaternion._y, this.state.quaternion._z, this.state.quaternion._w)
}

ThreeObject3DPlugin.prototype.update_input = function(slot, data) {
	if (!this.object3d)
		return;

	this.inputValues[slot.name] = data

	var that = this

	var handlers = [
		function() {
			that.graphInputs.position.x = data.x
			that.graphInputs.position.y = data.y
			that.graphInputs.position.z = data.z
		},
		function() {
			that.graphInputs.quaternion.setFromEuler(new THREE.Euler(data.x, data.y, data.z))
		},
		function() {
			that.graphInputs.scale.x = data.x
			that.graphInputs.scale.y = data.y
			that.graphInputs.scale.z = data.z
		},
		function() { that.object3d.visible = data },
		function() { that.object3d.castShadow = data },
		function() { that.object3d.receiveShadow = data },
		function() { that.object3d.name = data },
		function() { that.object3d.channels.set(data) }
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
	this.object3d.scale.set(
		this.graphInputs.scale.x + this.state.scale.x,
		this.graphInputs.scale.y + this.state.scale.y,
		this.graphInputs.scale.z + this.state.scale.z)

	this.object3d.position.set(
		this.graphInputs.position.x + this.state.position.x - this.state.pivot.x,
		this.graphInputs.position.y + this.state.position.y - this.state.pivot.y,
		this.graphInputs.position.z + this.state.position.z - this.state.pivot.z)

	this.object3d.quaternion.set(
		this.state.quaternion._x,
		this.state.quaternion._y,
		this.state.quaternion._z,
		this.state.quaternion._w)

	this.object3d.quaternion.multiply(this.graphInputs.quaternion)
}
