E2.plugins["if_else_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Allows \'true\' though if \'condition\' is true or \'false\' otherwise.';
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL },
		{ name: 'true', dt: core.datatypes.FLOAT } ,
		{ name: 'false', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.condition = false;
		self.yes = 0.0;
		self.no = 0.0;
		self.upd_state = [false, false, false]
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.condition = data;
		else if(slot.index === 1)
			self.yes = data;
		else
			self.no = data;
			
		self.upd_state[slot.index] = true;
	};	

	this.update_state = function(delta_t)
	{
		var us = self.upd_state;
		
		self.updated = us[0] || us[self.condition ? 1 : 2];
		us[0] = us[1] = us[2] = false;
	}

	this.update_output = function(slot)
	{
		return self.condition ? self.yes : self.no;
	};	
};
