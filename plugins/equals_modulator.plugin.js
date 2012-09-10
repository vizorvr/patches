E2.plugins["equals_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true if <b>value</b> equals <b>reference</b> and false otherwise.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference value to comprate <b>value</b> to.', def: 0 } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'True if <b>value</b> equals <b>reference</b> and false otherwise.', def: 'False' } ];
	
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
		self.state = self.value === self.ref;
	};
	
	this.update_output = function(slot)
	{
		return self.state;
	};	
};
