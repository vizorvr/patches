E2.plugins["round_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the input <b>value</b> rounded to the nearest integer.';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'The input value to be rounded.', def: 0 } ];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'The rounded integer.', def: 0 } ];
	
	this.reset = function()
	{
		self.value = 0;
	};
	
	this.update_input = function(slot, data)
	{
		self.value = Math.round(data);
	};	
	
	this.update_output = function(slot)
	{
		return self.value;
	};	
};
