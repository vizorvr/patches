E2.p = E2.plugins["mouse_button_generator"] = function(core, node)
{
	this.desc = 'Emits the current mouse button state.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'Left', dt: core.datatypes.BOOL, desc: 'True if the left mouse button is pressed and false otherwise.', def: false },
		{ name: 'Middle', dt: core.datatypes.BOOL, desc: 'True if the middle mouse button is pressed and false otherwise.', def: false },
		{ name: 'Right', dt: core.datatypes.BOOL, desc: 'True if the right mouse button is pressed and false otherwise.', def: false }
	];	
};

E2.p.prototype.update_output = function(slot)
{
	return this.buttons[slot.index];
};

E2.p.prototype.mouse_down = function(self) { return function(e)
{
	e.preventDefault();
	self.buttons[e.which - 1] = true;
	self.updated = true;
}};

E2.p.prototype.mouse_up = function(self) { return function(e)
{
	self.buttons[e.which - 1] = false;
	self.updated = true;
}};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.buttons = [];
		this.buttons[0] = this.buttons[1] = this.buttons[2] = false;
		E2.dom.webgl_canvas.mousedown(this.mouse_down(this));
		E2.dom.webgl_canvas.mouseup(this.mouse_up(this));
	}
};
