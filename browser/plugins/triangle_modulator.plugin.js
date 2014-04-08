E2.p = E2.plugins["triangle_modulator"] = function(core, node)
{
	this.desc = 'Triangle oscilator. A <b>time</b> value incrementing by one per second will yield a 1Hz output signal.';
	
	this.input_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'The current time in seconds.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits ((0.5 - |(<b>time</b> % 1.0) - 0.5|) - 0.25) * 4.', def: 0.0 }
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
	this.result = ((0.5 - Math.abs(this.time % 1.0 - 0.5)) - 0.25) * 4.0;

};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
