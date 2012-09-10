E2.plugins["min_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit the lesser of the two input values.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first input value', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The second input value', def: 0 } 
	];
	
	this.output_slots = [ { name: 'min', dt: core.datatypes.FLOAT, desc: 'The smaller of the two supplied values.', def: 0 } ];
	
	this.reset = function()
	{
		self.val_a = 0.0;
		self.val_b = 0.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.val_a = data;
		else
			self.val_b = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = Math.min(self.val_a, self.val_b);
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
