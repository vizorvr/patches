E2.plugins["triangle_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Triangle oscilator. A <b>time</b> value incrementing by one per second will yield a 1Hz output signal.';
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT, desc: 'The current time in seconds.', def: 0 } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits ((0.5 - |(<b>time</b> % 1.0) - 0.5|) - 0.25) * 4.', def: 0 } ];
	
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
		self.result = ((0.5 - Math.abs(self.time % 1.0 - 0.5)) - 0.25) * 4.0;

	};
	
	this.update_output = function(slot)
	{
		return self.result;
	};	
};
