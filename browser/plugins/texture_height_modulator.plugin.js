E2.p = E2.plugins["texture_height_modulator"] = function(core, node)
{
	this.desc = 'Emits the supplied texture height.';
	
	this.input_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The texture to emit the height of.', def: null }
	];
	
	this.output_slots = [ 
		{ name: 'height', dt: core.datatypes.FLOAT, desc: 'The supplied texture height.' }
	];
	
	this.height = 0;
};

E2.p.prototype.reset = function()
{
	this.height = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.height = data ? parseInt(data.height, 10) : 0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.height;
};
