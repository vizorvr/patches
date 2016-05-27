(function() {
var ViveController = E2.plugins.vive_controller = function(core, node) {
	function createOutput(name, dt) {
		return {
			name: name,
			dt: dt,
			desc: name
		}
	}

	this._core = core

	this.desc = 'Buttons and axes from HTC Vive Controller'

	this.vibrate = false

	this.input_slots = [{
		name: 'pad number',
		dt: core.datatypes.FLOAT,
		desc: 'Gamepad number',
		def: 0
	},
	{
		name: 'vibrate',
		dt: core.datatypes.BOOL,
		desc: 'Vibrates the gamepad while this is true',
		def: false
	}]

	this.output_slots = [
		createOutput('touchpad clicked', E2.dt.BOOL),
		createOutput('trigger clicked', E2.dt.BOOL),
		createOutput('grip clicked', E2.dt.BOOL),
		createOutput('menu clicked', E2.dt.BOOL),

		createOutput('touchpad x value', E2.dt.VECTOR),
		createOutput('touchpad y value', E2.dt.VECTOR),
		createOutput('trigger value', E2.dt.FLOAT),

		{
			name: 'position',
			dt: core.datatypes.VECTOR,
			desc: 'The position of the Vive Controller'
		},

		{
			name: 'rotation',
			dt: core.datatypes.VECTOR,
			desc: 'The rotation of the Vive Controller'
		}
	]

	this.position = new THREE.Vector3(0, 0, 0)
	this.rotation = new THREE.Euler()
	this.rotationQuaternion = new THREE.Quaternion()

	this._gamepadIndex = 0
	this.always_update = true
}

ViveController.prototype.reset = function() {
	this.updated = true
}

ViveController.prototype.update_input = function(slot, data) {
	if (slot.name === 'pad number') {
		this._gamepadIndex = data
		return;
	}

	if (slot.name === 'vibrate')
		this.vibrate = data
}

ViveController.prototype.update_state = function() {
	this.gamepads = navigator.getGamepads()
	var pad = this.gamepad = this.gamepads[this._gamepadIndex]

	if (!pad)
		return;

	if (pad.vibrate)
		pad.vibrate(this.vibrate ? 100 : 0)

	this.updated = true

	if (!pad.pose)
		return

	this.position.set(
		pad.pose.position[0],
		pad.pose.position[1],
		pad.pose.position[2])

	this.position.add(E2.app.player.camera.offset)

	this.rotation.setFromQuaternion(
		this.rotationQuaternion.fromArray(pad.pose.orientation),
		'YZX')
}

ViveController.prototype.update_output = function(slot) {
	if (!this.gamepad)
		return slot.dt.id === E2.dt.FLOAT.id ? 0.0 : false

	if (slot.name === 'position')
		return this.position

	if (slot.name === 'rotation')
		return this.rotation

	if (slot.name === 'touchpad clicked')
		return this.gamepad.buttons[0].pressed

	if (slot.name === 'trigger clicked')
		return this.gamepad.buttons[1].pressed

	if (slot.name === 'grip clicked')
		return this.gamepad.buttons[2].pressed

	if (slot.name === 'menu clicked')
		return this.gamepad.buttons[3].pressed

	if (slot.name === 'touchpad x value')
		return this.gamepad.axes[0]

	if (slot.name === 'touchpad y value')
		return this.gamepad.axes[1]

	if (slot.name === 'trigger value')
		return this.gamepad.buttons[1].value
}

})()