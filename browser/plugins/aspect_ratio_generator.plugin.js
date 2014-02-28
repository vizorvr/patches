E2.p = E2.plugins["aspect_ratio_generator"] = function(core, node)
{
	this.desc = 'Emits current renderer aspect ratio (width / height).';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'aspect', dt: core.datatypes.FLOAT, desc: 'The current renderer aspect ratio.' } ];
	
	this.canvas = core.renderer.canvas[0];
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	var c = this.canvas;

	return c.width / c.height;
};
