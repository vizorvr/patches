E2.plugins["or_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit true if both input values are true and false otherwise.';
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
	
	this.update_input = function(slot, data)
	{
		self.conds[slot.index] = data;
	};	

	this.update_state = function(delta_t)
	{
		self.state = self.conds[0] || self.conds[1];
	};
	
	this.update_output = function(slot)
	{
		return self.state;
	};	
};
