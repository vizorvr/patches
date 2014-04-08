E2.p = E2.plugins["square_modulator"] = function(core, node)
{
	this.desc = 'Square oscilator. A <b>time</b> value incrementing by one unit per second will yield a 1Hz output signal.';
	
	this.input_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Time in seconds.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits 1 if <b>time</b> % 1 is less than 0.5 and -1 otherwise.', def: 0.0 }
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
	this.result = this.time % 1.0 < 0.5 ? 1.0 : -1.0;

};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
