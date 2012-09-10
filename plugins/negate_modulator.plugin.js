E2.plugins["negate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the sign inverted input value.';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be negated.', def: 0 } ];
	this.output_slots = [ { name: '-value', dt: core.datatypes.FLOAT, desc: 'The sign-inverted input value.', def: 0 } ];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		self.value = -data;
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
