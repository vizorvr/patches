E2.plugins["multiply_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Multiplies the two supplied values and emits the result.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 1 } 
	];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'The product of the two supplied values.', def: 0 } ];

	this.reset = function()
	{
		self.vals = [0.0, 1.0];
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		self.vals[slot.index] = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = self.vals[0] * self.vals[1];
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
