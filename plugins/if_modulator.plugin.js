E2.plugins["if_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Allows <b>value</b> though if <b>condition</b> is true and inhibits futher data-flow otherwise.';
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL, desc: 'Condition that, if true, allows <b>value</b> to be emitted.', def: 'False' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be emitted if <b>condition</b> is true.', def: 0 } 
	];
	
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits <b>value</b> if <b>condition</b> is true and nothing otherwise.' } ];
	
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
