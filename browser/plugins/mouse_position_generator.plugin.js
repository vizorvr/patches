E2.p = E2.plugins["mouse_position_generator"] = function(core, node)
{
	this.desc = 'Emits the current mouse position in clip space mapped to the canvas.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: '-1 at left edge of canvas and 1 at the right edge. Can be both smaller than -1 and larger than 1 if the mouse is outside the canvas bounds.', def: 0.0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: '-1 at top edge of canvas and 1 at the bottom edge. Can be both smaller than -1 and larger than 1 if the mouse is outside the canvas bounds.', def: 0.0 } 
	];	
	
	this.renderer = core.renderer;
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
	var fs = self.renderer.fullscreen;
	var w = fs ? wgl_c.clientWidth : wgl_c.width;
	var h = fs ? wgl_c.clientHeight : wgl_c.height;
	
	self.x = (((e.pageX - wgl_c.offsetLeft) / w) * 2.0) - 1.0;
	self.y = ((1.0 - ((e.pageY - wgl_c.offsetTop) / h)) * 2.0) - 1.0;
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
