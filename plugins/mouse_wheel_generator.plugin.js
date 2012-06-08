E2.plugins["mouse_wheel_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Return the current mouse wheel state.';
	this.input_slots = [];
	this.output_slots = [ { name: 'delta', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>The delta mouse wheel movement.' } ];	
	
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
