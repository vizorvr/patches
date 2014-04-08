E2.p = E2.plugins["material_texture_modulator"] = function(core, node)
{
	this.desc = 'Sets a material texture.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.', def: core.renderer.material_default },
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'The type of texture to use the supplied <b>texture</b> as. See also Generators/Values/Texture type.', def: Material.texture_type.DIFFUSE_COLOR },
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'A texture.', def: core.renderer.default_tex }
	];
	
	this.output_slots = [
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.material = data;
	else if(slot.index === 1)
		this.next_type = data < 0 ? 0 : data % Material.texture_type.COUNT;
	else if(slot.index === 2)
		this.texture = data;
};

E2.p.prototype.update_state = function()
{
	if(this.type !== -1)
		this.material.textures[this.type] = null;
	
	this.material.textures[this.next_type] = this.texture;
	this.type = this.next_type;
};

E2.p.prototype.update_output = function(slot)
{
	return this.material;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.material = new Material();
		this.type = -1;
		this.next_type = Material.texture_type.DIFFUSE_COLOR;
		this.texture = null;
	}
};
