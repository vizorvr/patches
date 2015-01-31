E2.p = E2.plugins["viewport_width_generator"] = function(core, node)
{
	this.desc = 'Emits current renderer view width.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'width', dt: core.datatypes.FLOAT, desc: 'The current renderer viewport width.' }
	];
	
	this.core = core;
	this.canvas = core.renderer.canvas[0];
	this.delegate = this._onResize.bind(this);
	
	this.core.renderer.on('resize', this.delegate);
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.destroy = function(slot)
{
	this.core.renderer.off('resize', this.delegate);
};

E2.p.prototype.update_output = function(slot)
{
	return this.canvas.width;
};

E2.p.prototype._onResize = function()
{
	this.updated = true;
};
