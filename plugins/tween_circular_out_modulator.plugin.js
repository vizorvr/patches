E2.plugins["tween_circular_out_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Perform circular tween out over time.';
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT, desc: 'Time ranging from zero to one.', def: 0, lo: 0, hi: 1 } ];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits a circular tween out over <b>time</b>.', def: 0 } ];
	
	this.reset = function()
	{
		self.result = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		var d = data;
		
		d = d < 0.0 ? 0.0 : d > 1.0 ? 1.0 : d;
		self.result = Math.sqrt(1 - --d * d);
	};	
	
	this.update_output = function(slot)
	{
		return self.result;
	};	
};
