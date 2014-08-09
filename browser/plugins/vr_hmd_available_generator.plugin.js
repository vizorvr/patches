E2.p = E2.plugins["vr_hmd_available_generator"] = function(core, node)
{
	this.desc = 'Emits true if a VR Head Mounted Device is available and false otherwise.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True if a VR display device is available.' }
	];
	
	this.renderer = core.renderer;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.renderer.vr_hmd ? true : false;
};
