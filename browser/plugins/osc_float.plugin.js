E2.p = E2.plugins["osc_float"] = function(core, node)
{
	this.desc = 'Emits float value sent via OSC to address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'OSC address to listen to, eg. "/1/rotary23"' }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Float value from OSC message' }
	];
	
	this.core = core;
};

E2.p.prototype.update_input = function(slot, address)
{
	var self = this

	OscProxy.listen(address, function(args)
	{
		self.updated = true;
		self.value = args[0].value;
	});
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.core.add_aux_script('osc/osc-proxy.js');
};
