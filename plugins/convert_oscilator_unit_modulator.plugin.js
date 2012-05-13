E2.plugins["convert_oscilator_unit_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Rescales a number in the range -1;1 to the range 0;1.';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float\nRange: -1;1<break>' } ];	
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float\nRange: 0;1<break>' } ];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		var v = (data + 1.0) * 0.5;
		
		self.value = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
	};
	
	this.update_output = function(slot)
	{
		return self.value;
	};
};
