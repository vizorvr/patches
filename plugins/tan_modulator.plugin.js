E2.plugins["tan_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Tan(x).';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0 }
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'tan(<b>value</b>).', def: 0 } ];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = Math.tan(data);
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
