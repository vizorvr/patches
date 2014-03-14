E2.p = E2.plugins["assets_signal_started_generator"] = function(core, node)
{
	this.desc = 'Signals that load of an asset has been started.';
	
	this.input_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Increases the number of assets being loaded.' }
	];
	
	this.output_slots = [];
	
	this.core = core;
	this.value = false;
};

E2.p.prototype.reset = function()
{
	this.value = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = (this.value === false && data);
};

E2.p.prototype.update = function()
{
	if(this.value)
	{
		this.core.asset_tracker.signal_started();
		this.value = false;
	}
};
