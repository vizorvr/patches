E2.p = E2.plugins["mouse_wheel_generator"] = function(core, node)
{
	this.desc = 'Emits the current mouse wheel state.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'delta', dt: core.datatypes.FLOAT, desc: 'The delta mouse wheel movement.', def: 0.0 }
	];
};

E2.p.prototype.update_output = function(slot)
{
	return this.delta;
};

E2.p.prototype.mouse_wheel = function(self) { return function(e, delta)
{
	self.delta = -delta;
	self.updated = true;
}};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.delta = 0.0;
		E2.dom.webgl_canvas.bind('mousewheel', this.mouse_wheel(this));
	}
};
