E2.plugins["cosine_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Cosine oscilator. A <b>time</b> value incrementing by one unit per second will yield a 1Hz output signal.';
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT, desc: 'Time in seconds', def: 0 } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits cos(<b>time</b> * 2pi)', def: 0 } ];

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
		self.result = Math.cos(self.time * 2.0 * Math.PI);
	};
	
	this.update_output = function(slot)
	{
		return self.result;
	};	
};
