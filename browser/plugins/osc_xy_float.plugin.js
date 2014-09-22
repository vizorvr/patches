E2.p = E2.plugins["osc_xy_float"] = function(core, node)
{
	this.desc = 'Emits two float values sent via OSC to address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'OSC address to listen to, eg. "/1/xy1"', def: null }
	];
	
	this.output_slots = [
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'First float value from OSC message' },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Second float value from OSC message' }
	];
	
	core.add_aux_script('osc/osc-proxy.js');
	
	this.node = node;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(data === null)
		return;
		
	var self = this;

	OscProxy.listen(data, function(args)
	{
		self.updated = true;
		self.x = args[0].value;
		self.y = args[1].value;
	});
};

E2.p.prototype.reset = function()
{
	this.x = this.y = 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	if (slot.index === 0)
		return this.x;

	return this.y;
};
