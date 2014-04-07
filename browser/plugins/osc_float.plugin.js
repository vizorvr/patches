E2.p = E2.plugins["osc_float"] = function(core, node)
{
	this.desc = 'Emits float value sent via OSC to address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'OSC address to listen to, eg. "/1/rotary23"', def: null }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Float value from OSC message', def: 0.0 }
	];
	
	this.core = core;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(!data)
		return; // TODO Should stop any existing listener.
		
	var self = this

	// TODO: How are existing listeners discarded?
	OscProxy.listen(data, function(args)
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
