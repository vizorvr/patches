E2.p = E2.plugins["texture_wrap_modulator"] = function(core, node)
{
	this.desc = 'Sets the UV-coordinate wrapping type of the supplied texture.';
	
	this.input_slots = [ 
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'Input texture.', def: null },
		{ name: 'wrap s', dt: core.datatypes.FLOAT, desc: 'See Generators/Values/Texture wrap type.', def: core.renderer.context.REPEAT },
		{ name: 'wrap t', dt: core.datatypes.FLOAT, desc: 'See Generators/Values/Texture wrap type.', def: core.renderer.context.REPEAT }
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
		this.wrap_s = Math.round(data);
	else if(slot.index === 2)
		this.wrap_t = Math.round(data);
};

E2.p.prototype.update_state = function()
{
	if(!this.texture)
		return;
		
	this.texture.wrap_s = this.wrap_s;
	this.texture.wrap_t = this.wrap_t;
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
		this.wrap_s = this.gl.REPEAT;
		this.wrap_t = this.gl.REPEAT;
	}
};
