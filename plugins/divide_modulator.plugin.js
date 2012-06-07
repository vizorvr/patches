E2.plugins["divide_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Divides \'value\' by \'scalar\' and emits the result.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'scalar', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.value = 0.0;
		self.scalar = 1.0;
		self.result = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = data;
		else
			self.scalar = data < 0.0000001 ? 1.0 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.result = self.value / self.scalar;
	};
	
	this.update_output = function(slot)
	{
		return self.result;
	};	
};
