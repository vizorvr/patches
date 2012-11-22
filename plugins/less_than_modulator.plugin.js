E2.plugins["less_than_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true if the supplied <b>value</b> is less than <b>reference</b> and false otherwise.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to compare.', def: 0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference to compare <b>value</b> to.', def: 0 } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits true if <b>value</b> is less than <b>reference</b> and false otherwise.', def: 'False' } ];
	
	this.reset = function()
	{
		self.value = 0.0;
		self.ref = 0.0;
		self.state = false;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = data;
		else
			self.ref = data;
	};	

	this.update_state = function(delta_t)
	{
		var nst = self.value < self.ref;
		
		if(nst !== self.state)
			self.state = nst;
		else
			self.updated = false;
	};
	
	this.update_output = function(slot)
	{
		return self.state;
	};	
};
