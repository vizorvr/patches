E2.p = E2.plugins["stop_emitter"] = function(core, node)
{
	this.desc = 'Stops graph playback when a true value is received by the <b>bool</b> slot.';
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'When true is received by this slot, graph playback is stopped.' }
	];
	
	this.core = core;
	this.output_slots = [];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(data)
	{
		if(E2.app.onStopClicked)
			E2.app.onStopClicked();
		else
			this.core.player.stop();
	}
};
