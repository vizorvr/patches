E2.plugins["if_else_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits <b>true value</b> if <b>condition</b> is true and <b>false value</b> otherwise. The output only updates when the <b>condition</b> or relavant input value does. Any incoming data-flow to the value slot excluded by <b>condition</b> does not result in data emission.';
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL, desc: 'Send true to route <b>true value</b> to the output and false to route <b>false value</b>.', def: 'False' },
		{ name: 'true value', dt: core.datatypes.FLOAT, desc: 'Value to be send to output if <b>condition</b> is true', def: 0 } ,
		{ name: 'false value', dt: core.datatypes.FLOAT, desc: 'Value to be send to output if <b>condition</b> is false', def: 0  }
	];
	
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits <b>true value</b> if <b>condition</b> is true and <b>false value</b> otherwise.', def: 'False value' } ];
	
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
