E2.plugins["sawtooth_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sawtooth oscilator. A <b>time</b> value incrementing by one unit per second will yield a 1Hz output signal.';
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT, desc: 'Time in seconds.', def: 0 } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits ((<b>time</b> % 1) - 0.5) * 2.', lo: -1, hi: 1, def: 0 } ];
	
	this.reset = function()
	{
		self.time = 0.0;
		self.result = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		self.time = data;
	};	

	this.update_state = function(delta_t)
	{
		self.result = ((self.time % 1.0) - 0.5) * 2;

	};
	
	this.update_output = function(slot)
	{
		return self.result;
	};	
};
