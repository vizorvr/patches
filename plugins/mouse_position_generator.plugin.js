E2.plugins["mouse_position_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the current mouse position in unit space mapped to the canvas.';
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: '0 at left edge of canvas and 1 at the right edge. Can be both smaller than 0 and larger than one if the mouse is outside the canvas bounds.', def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: '0 at top edge of canvas and 1 at the bottom edge. Can be both smaller than 0 and larger than one if the mouse is outside the canvas bounds.', def: 0 } 
	];	

	this.update_output = function(slot)
	{
		if(slot.index === 0)
			return self.x;
		
		return self.y;
	};
	
	this.mouse_moved = function(e)
	{
		var wgl_c = E2.dom.webgl_canvas[0]; 
		
		self.x = (e.pageX - wgl_c.offsetLeft) / wgl_c.width;
		self.y = (e.pageY - wgl_c.offsetTop) / wgl_c.height;
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
