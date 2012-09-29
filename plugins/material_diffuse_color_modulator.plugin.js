E2.plugins["material_diffuse_color_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Set the diffuse color.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The material diffuse color.', def: 'White' } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.color = data
	};
	
	this.update_state = function(delta_t)
	{
		self.material.diffuse_color = self.color;
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
			self.color = new Color(1, 1, 1, 1);
		}
	};
};
