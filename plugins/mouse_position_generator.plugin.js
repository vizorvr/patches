E2.plugins["mouse_position_generator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT },
		{ name: 'y', dt: core.datatypes.FLOAT } 
	];	

	this.update_output = function(slot)
	{
		if(slot.index === 0)
			return self.x;
		
		return self.y;
	};
	
	this.mouse_moved = function(e)
	{
		var pos = E2.dom.webgl_canvas.position();
		
		self.x = (e.pageX - pos.left) / E2.dom.webgl_canvas.width();
		self.y = (e.pageY - pos.top) / E2.dom.webgl_canvas.height();
		self.updated = true;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.x = self.y = 0.0;
			$(document).mousemove(self.mouse_moved);
		}
	};	
};
