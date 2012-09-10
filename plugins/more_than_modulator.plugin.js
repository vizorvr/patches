E2.plugins["more_than_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true if the supplied <b>value</b> is larger than <b>reference</b> and false otherwise.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be compared.', def: 0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference to compare <b>value</b> to.', def: 0 } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits true if <b>value</b> is larger than <b>reference</b>.', def: false } ];
	
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
		self.state = self.value > self.ref;
	};
	
	this.update_output = function(slot)
	{
		return self.state;
	};	
};
