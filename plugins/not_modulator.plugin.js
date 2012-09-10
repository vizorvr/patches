E2.plugins["not_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true if the input is false and vice versa.';
	this.input_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Input boolean to be inverted.', def: 'False' } ];
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Truth-inverted input value.', def: 'True' } ];
	
	this.update_input = function(slot, data)
	{
		self.input = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output = !self.input;
	};
	
	this.update_output = function(slot)
	{
		return self.output;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
		{
			self.input = false;
			self.output = true;
		}
	};
};
