E2.plugins["delta_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the derivative of the incomming value.';
	this.input_slots = 
	[ 
		{ name: 'reset', dt: core.datatypes.BOOL },
		{ name: 'value', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'delta', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.input_val = 0.0;
		self.last_val = 0.0;
		self.output_val = 0.0;
		self.clear = false;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.clear = data;
		else if(slot.index === 1)
			self.input_val = data;
	};	

	this.update_state = function(delta_t)
	{
		if(self.clear)
		{
			self.output_val = 0.0;
			self.clear = false;
		}
		else
			self.output_val = self.input_val - self.last_val;
		
		self.last_val = self.input_val;
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
