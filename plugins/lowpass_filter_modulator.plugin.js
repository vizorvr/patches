E2.plugins["lowpass_filter_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Perform simple 1st-order lowpass filtering of the supplied value.\n\n<b>Caution:</b> Do not use this plugin to filter infrequently updated values. This plugin expects continuous input every frame; if necessary, a clock or another cheap continuous float provider can be multiplied by zero and added to the lowpass input to drive updates.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value. Must be updated every frame for correct operation of the filter.', def: 0 },
		{ name: 'amount', dt: core.datatypes.FLOAT, desc: 'Filter amount. Zero is pure passthrough, 0.999 maximum filtering.', lo: 0, hi: 0.999, def: 0.9 } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'The smoothed output value', def: 0 } ];

	this.reset = function()
	{
		self.input_val = 0.0;
		self.amount = 0.9;
		self.output_val = 0.0;
		self.last_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.input_val = data;
		else
			self.amount = data < 0.0 ? 0.0 : data > 0.999 ? 0.999 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = (self.input_val * (1.0 - self.amount)) + (self.last_val * self.amount);
		self.last_val = self.output_val; 
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
