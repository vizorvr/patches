E2.plugins["material_shinyness_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Set the specularity coefficient.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'shinyness', dt: core.datatypes.FLOAT, desc: 'Higher values indicates higher specularity.', def: 0, lo: 0, hi: 10 } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.shinyness = data < 0.0 ? 0.0 : data > 10.0 ? 10.0 : data;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.shinyness = self.shinyness;
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
			self.shinyness = 1.0;
		}
	};
};
