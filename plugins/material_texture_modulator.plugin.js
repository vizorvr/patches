E2.plugins["material_texture_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets a material texture.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'The type of texture to use the supplied <b>texture</b> as. See also Generators/Values/Texture type.', def: 'Diffuse color' },
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'A texture.', def: 'None.' }
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else if(slot.index === 1)
			self.next_type = data < 0 ? 0 : data % Material.texture_type.COUNT;
		else if(slot.index === 2)
			self.texture = data
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 2)
			self.texture = null;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.textures[self.type] = null;
		self.material.textures[self.next_type] = self.texture;
		self.type = self.next_type;
	};
	
	this.update_output = function(slot)
	{
		return self.material;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.material = new Material();
			self.next_type = self.type = Material.texture_type.DIFFUSE_COLOR;
			self.texture = null;
		}
	};
};
