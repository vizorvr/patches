E2.plugins["cos_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Cos(x).';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0 }
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'cos(<b>value</b>).', def: 0 } ];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = Math.cos(data);
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
