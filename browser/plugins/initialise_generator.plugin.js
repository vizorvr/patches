E2.p = E2.plugins["initialise_generator"] = function(core, node)
{
	this.desc = 'Emits true the first frame after playback is started, then false for one frame and stop emitting. Can be used to run initialisation logic on the first frame of playback only.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits true on first frame of playback, then false for one frame, then stops emitting.' }
	];
	
	this.core = core;
	this.st = [false, false];
	this.val = false;
};

E2.p.prototype.stop = function()
{
	this.st[0] = this.st[1] = true;
};

E2.p.prototype.update_state = function()
{
	this.val = this.st[0] && this.st[1];
	
	this.updated = this.st[0];
	this.st[0] = this.st[1];
	this.st[1] = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.val;
};
