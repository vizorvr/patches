E2.plugins["mouse_wheel_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the current mouse wheel state.';
	this.input_slots = [];
	this.output_slots = [ { name: 'delta', dt: core.datatypes.FLOAT, desc: 'The delta mouse wheel movement.', def: 0 } ];	
	
	this.update_output = function(slot)
	{
		return self.delta;
	};
	
	this.mouse_wheel = function(e, delta)
	{
		self.delta = -delta;
		self.updated = true;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.delta = 0.0;
			E2.dom.webgl_canvas.bind('mousewheel', self.mouse_wheel);
		}
	};	
};
