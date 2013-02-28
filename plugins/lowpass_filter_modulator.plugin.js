E2.p = E2.plugins["lowpass_filter_modulator"] = function(core, node)
{
	this.desc = 'Perform simple 1st-order lowpass filtering of the supplied value.\n\n<b>Caution:</b> Do not use this plugin to filter infrequently updated values. This plugin expects continuous input every frame; if necessary, a clock or another cheap continuous float provider can be multiplied by zero and added to the lowpass input to drive updates.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value. Must be updated every frame for correct operation of the filter.', def: 0 },
		{ name: 'amount', dt: core.datatypes.FLOAT, desc: 'Filter amount. Zero is pure passthrough, 0.999 maximum filtering.', lo: 0, hi: 0.999, def: 0.9 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The smoothed output value', def: 0 }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.input_val = data;
	else
		this.amount = data < 0.0 ? 0.0 : data > 0.999 ? 0.999 : data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = (this.input_val * (1.0 - this.amount)) + (this.last_val * this.amount);
	this.last_val = this.output_val; 
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.input_val = 0.0;
		this.amount = 0.9;
		this.output_val = 0.0;
		this.last_val = 0.0;
	}
};
