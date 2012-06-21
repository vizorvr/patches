E2.plugins["negate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit the sign inverted input value.';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.output_slots = [ { name: 'inverse', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.value = 0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.value = -data;
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
