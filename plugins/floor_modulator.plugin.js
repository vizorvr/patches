E2.plugins["floor_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Round the supplied float to the closest lower interger.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	
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
