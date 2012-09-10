E2.plugins["floor_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Round <b>value</b> to the closest lower interger.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be rounded.', def: 0 }
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'The rounded result.', def: 0 } ];
	
	this.reset = function()
	{
		self.value = 0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = Math.floor(data);
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
