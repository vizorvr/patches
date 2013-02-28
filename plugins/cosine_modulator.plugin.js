E2.p = E2.plugins["cosine_modulator"] = function(core, node)
{
	this.desc = 'Cosine oscilator. A <b>time</b> value incrementing by one unit per second will yield a 1Hz output signal.';
	
	this.input_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Time in seconds', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits cos(<b>time</b> * 2pi)', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.time = 0.0;
	this.result = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.time = data;
};	

E2.p.prototype.update_state = function()
{
	this.result = Math.cos(this.time * 2.0 * Math.PI);
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
