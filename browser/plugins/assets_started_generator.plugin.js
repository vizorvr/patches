E2.p = E2.plugins["assets_started_generator"] = function(core, node)
{
	this.desc = 'Emits the current number of assets that have begun loading.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'count', dt: core.datatypes.FLOAT, desc: 'Number of assets that have begun loading.' }
	];
	
	this.core = core;
	this.node = node;
	
	this.asset_listener = function(self) { return function()
	{
		self.node.queued_update = 1;
	}}(this);
	
	core.asset_tracker.add_listener(this.asset_listener);
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.destroy = function()
{
	this.core.asset_tracker.remove_listener(this.asset_listener);
};

E2.p.prototype.update_output = function(slot)
{
	return this.core.asset_tracker.started;
};
