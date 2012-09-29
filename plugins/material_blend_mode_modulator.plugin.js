E2.plugins["material_blend_mode_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Set the blend mode.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'blend mode', dt: core.datatypes.FLOAT, desc: 'Set the material blend mode.', def: 'Normal' } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.blend_mode = data;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.blend_mode = self.blend_mode;
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
			self.blend_mode = Renderer.blend_mode.NORMAL;
		}
	};
};
