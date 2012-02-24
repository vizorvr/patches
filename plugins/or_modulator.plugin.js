E2.plugins["or_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL },
		{ name: 'bool', dt: core.datatypes.BOOL } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL } ];
	
	this.reset = function()
	{
		self.conds = [ false, false ];
		self.state = false;
	};
	
	this.update_input = function(index, data)
	{
		self.conds[index] = data;
	};	

	this.update_state = function(delta_t)
	{
		self.state = self.conds[0] || self.conds[1];
	};
	
	this.update_output = function(index)
	{
		return self.state;
	};	
};
