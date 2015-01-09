E2.p = E2.plugins["gamepad_generator"] = function(core, node)
{
	function createButton(name, isFloat)
	{
		return {
			name: name,
			dt: isFloat ? core.datatypes.FLOAT : core.datatypes.BOOL,
			desc: name,
			def: isFloat ? 0.0 : false
		};
	}

	this._core = core;

	this.desc = 'Buttons and axes from HTML5 standard gamepad (supports only Chrome and XBOX 360 controller atm).';

	this.input_slots = [];

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

		createButton('extra'), // 16; xbox 360 button

		createButton('left stick X', true),
		createButton('left stick Y', true),
		createButton('right stick X', true),
		createButton('right stick Y', true)
	];

	this._gamepadIndex = 0;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	function buttonPressed(b)
	{
		if (typeof(b) === 'object')
			return b.pressed;

		return b === 1.0;
	}

	var gamepads = navigator.getGamepads();
	if (!gamepads)
		return 0.0;

	var pad = gamepads[this._gamepadIndex];
	if (!pad)
		return 0.0;

	this.updated = true;

	if (slot.index < 17)
	{
		// float
		if (this.output_slots[slot.index].dt.id === this._core.datatypes.FLOAT.id)
			return pad.buttons[slot.index].value;

		// bool
		return buttonPressed(pad.buttons[slot.index]);
	}

	return pad.axes[slot.index - 17];
};
