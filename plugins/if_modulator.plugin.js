E2.plugins["if_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Allows \'value\' though if \'condition\' is true and inhibits futher flow otherwise.';
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL },
		{ name: 'value', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.condition = false;
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.condition = data;
		else
			self.value = data;
	};	

	this.update_state = function(delta_t)
	{
		if(!self.condition)
			self.updated = false;
	};
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
