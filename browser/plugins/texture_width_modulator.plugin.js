E2.p = E2.plugins["texture_width_modulator"] = function(core, node)
{
	this.desc = 'Emits the supplied texture width.';
	
	this.input_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The texture to emit the width of.', def: null }
	];
	
	this.output_slots = [ 
		{ name: 'width', dt: core.datatypes.FLOAT, desc: 'The supplied texture width.' }
	];
	
	this.width = 0;
};

E2.p.prototype.reset = function()
{
	this.width = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.width = data ? parseInt(data.width, 10) : 0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.width;
};
