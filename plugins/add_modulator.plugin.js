E2.plugins["add_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Add two floating point values.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The second operand.', def: 0 } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'The result of <b>first</b> + <b>second</b>.', def: 0 } ];
	
	this.reset = function()
	{
		self.input_val = 0.0;
		self.add_val = 0.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.input_val = data;
		else
			self.add_val = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = self.input_val + self.add_val;
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
