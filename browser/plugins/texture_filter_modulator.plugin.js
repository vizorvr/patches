E2.p = E2.plugins["texture_filter_modulator"] = function(core, node)
{
	this.desc = 'Sets the rendering primitive type of the supplied mesh.';
	
	this.input_slots = [ 
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'Input texture.', def: null },
		{ name: 'minify', dt: core.datatypes.FLOAT, desc: 'See Generators/Values/Texture filter type.', def: core.renderer.context.LINEAR },
		{ name: 'magnify', dt: core.datatypes.FLOAT, desc: 'See Generators/Values/Texture filter type.', def: core.renderer.context.LINEAR }
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The modified texture.' }
	];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.texture = data;
	else if(slot.index === 1)
		this.min_filter = Math.round(data);
	else if(slot.index === 2)
		this.mag_filter = Math.round(data);
};

E2.p.prototype.update_state = function()
{
	if(!this.texture)
		return;
		
	this.texture.min_filter = this.min_filter;
	this.texture.mag_filter = this.mag_filter;
};

E2.p.prototype.update_output = function(slot)
{
	return this.texture;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.texture = null;
		this.min_filter = this.gl.LINEAR;
		this.mag_filter = this.gl.LINEAR;
	}
};
