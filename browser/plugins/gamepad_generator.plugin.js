(function() {
var GamePadGenerator = E2.plugins.gamepad_generator = function(core, node) {
	function createButton(name, isFloat) {
		return {
			name: name,
			dt: isFloat ? core.datatypes.FLOAT : core.datatypes.BOOL,
			desc: name,
			def: isFloat ? 0.0 : false
		}
	}

	this._core = core

	this.desc = 'Buttons and axes from HTML5 standard gamepad, and pose from VR Gamepad.'

	this.input_slots = [{
		name: 'pad number',
		dt: core.datatypes.FLOAT,
		desc: 'Gamepad number',
		def: 0
	}]

	this.output_slots = [
		createButton('button 0'),
		createButton('button 1'),
		createButton('button 2'),
		createButton('button 3'),

		createButton('left bumper'),
		createButton('right bumper'),
		createButton('left trigger', true),
		createButton('right trigger', true),

		createButton('select'),
		createButton('start'), // 9

		createButton('left stick button'),
		createButton('right stick button'), 

		createButton('D-pad top'),
		createButton('D-pad bottom'),
		createButton('D-pad left'),
		createButton('D-pad right'),

		createButton('extra'), // 16 - xbox 360 button

		createButton('left stick X', true),
		createButton('left stick Y', true),
		createButton('right stick X', true),
		createButton('right stick Y', true),

		{
			name: 'position',
			dt: core.datatypes.VECTOR,
			desc: 'The position of a VR Gamepad'
		},

		{
			name: 'rotation',
			dt: core.datatypes.VECTOR,
			desc: 'The rotation of a VR Gamepad'
		},
	]

	this.position = new THREE.Vector3(0, 0, 0)
	this.rotation = new THREE.Vector4(0, 0, 0, 0)

	this._gamepadIndex = 0
	this.always_update = true
}

GamePadGenerator.prototype.reset = function() {
	this.updated = true
}

GamePadGenerator.prototype.update_input = function(slot, data) {
	this._gamepadIndex = data
}

GamePadGenerator.prototype.update_state = function() {
	this.gamepads = navigator.getGamepads()
	var pad = this.gamepad = this.gamepads[this._gamepadIndex]
	if (!pad) {
		return;
	}

	this.updated = true

	if (!pad.pose)
		return;

	this.position.set(
		pad.pose.position[0],
		pad.pose.position[1],
		pad.pose.position[2])

	this.rotation.set(
		pad.pose.orientation[0],
		pad.pose.orientation[1],
		pad.pose.orientation[2])
}

GamePadGenerator.prototype.update_output = function(slot) {
	function buttonPressed(b) {
		if (typeof(b) === 'object')
			return b.pressed

		return b === 1.0
	}

	if (!this.gamepad)
		return 0.0

	if (slot.name === 'position') {
		return this.position
	}

	if (slot.name === 'rotation') {
		return this.rotation
	}

	if (slot.index < 23) {
		// float
		if (this.output_slots[slot.index].dt.id === this._core.datatypes.FLOAT.id)
			return this.gamepad.buttons[slot.index].value

		// bool
		return buttonPressed(this.gamepad.buttons[slot.index])
	}

	return this.gamepad.axes[slot.index - 23]
}

})()