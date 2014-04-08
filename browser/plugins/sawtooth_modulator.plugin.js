E2.p = E2.plugins["sawtooth_modulator"] = function(core, node)
{
	this.desc = 'Sawtooth oscilator. A <b>time</b> value incrementing by one unit per second will yield a 1Hz output signal.';
	
	this.input_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Time in seconds.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits ((<b>time</b> % 1) - 0.5) * 2.', lo: -1, hi: 1, def: 0.0 }
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
	this.result = ((this.time % 1.0) - 0.5) * 2.0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
