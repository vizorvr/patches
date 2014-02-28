E2.p = E2.plugins["viewport_width_generator"] = function(core, node)
{
	this.desc = 'Emits current renderer view width.';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'width', dt: core.datatypes.FLOAT, desc: 'The current renderer viewport width.' } ];
	
	this.canvas = core.renderer.canvas[0];
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	return this.canvas.width;
};
