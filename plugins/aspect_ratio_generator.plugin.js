E2.p = E2.plugins["aspect_ratio_generator"] = function(core, node)
{
	this.desc = 'Emits current renderer aspect ratio (width / height).';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'aspect', dt: core.datatypes.FLOAT, desc: 'The current renderer aspect ratio.' } ];
	
	this.canvas = core.renderer.canvas;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	var c = this.canvas;

	// TODO: We've *got* to get rid of this. It locks up the UI thread badly.
	return c.width() / c.height();
};
