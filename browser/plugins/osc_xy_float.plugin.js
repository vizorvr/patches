E2.p = E2.plugins["osc_xy_float"] = function(core, node)
{
	this.desc = 'Emits two float values sent via OSC to address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'OSC address to listen to, eg. "/1/xy1"' }
	];
	
	this.output_slots = [
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'First float value from OSC message' },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Second float value from OSC message' }
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
		self.x = args[0].value;
		self.y = args[1].value;
	});
};

E2.p.prototype.reset = function()
{
	OscProxy.connect();
	this.x = this.y = 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	if (slot.index === 0)
		return this.x;

	return this.y;
};
