E2.p = E2.plugins["aspect_ratio_generator"] = function(core, node)
{
	this.desc = 'Emits current renderer aspect ratio (width / height).';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'aspect', dt: core.datatypes.FLOAT, desc: 'The current renderer aspect ratio.' } ];
	
	this.core = core;
	this.canvas = E2.dom.webgl_canvas[0];
	this.delegate = this._onResize.bind(this);
	
	this.core.on('resize', this.delegate);
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.destroy = function(slot)
{
	this.core.off('resize', this.delegate);
};

E2.p.prototype.update_output = function(slot)
{
	return this.canvas.width / this.canvas.height;
};

E2.p.prototype._onResize = function()
{
	this.updated = true;
};
