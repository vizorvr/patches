E2.plugins["material_alpha_clip_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'If set to true, fragments with alpha < 0.5 will be discarded.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'alpha clip', dt: core.datatypes.BOOL, desc: 'Set to true to discard fragments with alpha < 0.5.', def: 'False' } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.alpha_clip = data;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.alpha_clip = self.alpha_clip;
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
			self.alpha_clip = false;
		}
	};
};
