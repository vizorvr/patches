E2.p = E2.plugins["osc_xyz_float"] = function(core, node)
{
	this.desc = 'Emits three float values sent via OSC to address.';
	
	this.input_slots = [
		{ name: 'address', dt: core.datatypes.TEXT, desc: 'OSC address to listen to, eg. "/accxyz"', def: "/accxyz" }
	];
	
	this.output_slots = [
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'First float value from OSC message' },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Second float value from OSC message' },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'Third float value from OSC message' }
	];
	
	core.add_aux_script('osc/osc-proxy.js');
	
	this.node = node;
};

E2.p.prototype.update_input = function(slot, data) {
	if(data === null)
		return;
		
	var self = this;

	OscProxy.listen(data, function(args) {
		self.updated = true;
		self.x = args[0].value;
		self.y = args[1].value;
		self.z = args[2].value;
	});
};

E2.p.prototype.reset = function()
{
	this.x = this.y = this.z = 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	if (slot.index === 0)
		return this.x;

	if (slot.index === 1)
		return this.y;

	return this.z;
};
