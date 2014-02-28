E2.p = E2.plugins["mouse_position_generator"] = function(core, node)
{
	this.desc = 'Emits the current mouse position in unit space mapped to the canvas.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: '0 at left edge of canvas and 1 at the right edge. Can be both smaller than 0 and larger than one if the mouse is outside the canvas bounds.', def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: '0 at top edge of canvas and 1 at the bottom edge. Can be both smaller than 0 and larger than one if the mouse is outside the canvas bounds.', def: 0 } 
	];	
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.x;
	
	return this.y;
};

E2.p.prototype.mouse_moved = function(self) { return function(e)
{
	var wgl_c = E2.dom.webgl_canvas[0]; 
	
	self.x = (e.pageX - wgl_c.offsetLeft) / wgl_c.width;
	self.y = (e.pageY - wgl_c.offsetTop) / wgl_c.height;
	self.updated = true;
}};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.x = this.y = 0.0;
		$(document).mousemove(this.mouse_moved(this));
	}
};
