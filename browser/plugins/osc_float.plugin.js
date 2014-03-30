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
	this.node = node;
};

E2.p.prototype.update_input = function(slot, data)
{
	if (!slot)
		return;

	this._address = data;

	var self = this

	OscProxy.listen(this._address, function(args)
	{
		self.updated = true;
		self.value = args[0].value;
	});
};

E2.p.prototype.reset = function()
{
	OscProxy.connect();
	this.value = 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
