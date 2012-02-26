E2.plugins["equals_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'reference', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL } ];
	
	this.reset = function()
	{
		self.value = 0.0;
		self.ref = 0.0;
		self.state = false;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = data;
		else
			self.ref = data;
	};	

	this.update_state = function(delta_t)
	{
		self.state = self.value === self.ref;
	};
	
	this.update_output = function(slot)
	{
		return self.state;
	};	
};
