E2.plugins["mouse_button_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the current mouse button state.';
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'Left', dt: core.datatypes.BOOL, desc: 'True if the left mouse button is pressed and false otherwise.', def: 'False' },
		{ name: 'Middle', dt: core.datatypes.BOOL, desc: 'True if the middle mouse button is pressed and false otherwise.', def: 'False' },
		{ name: 'Right', dt: core.datatypes.BOOL, desc: 'True if the right mouse button is pressed and false otherwise.', def: 'False' }
	];	

	this.update_output = function(slot)
	{
		return self.buttons[slot.index];
	};
	
	this.mouse_down = function(e)
	{
		self.buttons[e.which - 1] = true;
		self.updated = true;
	};
	
	this.mouse_up = function(e)
	{
		self.buttons[e.which - 1] = false;
		self.updated = true;
	};

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.buttons = [];
			self.buttons[0] = self.buttons[1] = self.buttons[2] = false;
			E2.dom.webgl_canvas.mousedown(self.mouse_down);
			E2.dom.webgl_canvas.mouseup(self.mouse_up);
		}
	};	
};
