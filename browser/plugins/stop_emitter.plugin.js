E2.p = E2.plugins["stop_emitter"] = function(core, node)
{
	this.desc = 'Stops graph playback when a true value is received by the <b>bool</b> slot.';
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'When true is received by this slot, graph playback is stopped.' }
	];
	
	this.output_slots = [];

	this.core = core;
	this.stop_seq = false;
};

E2.p.prototype.reset = function()
{
	this.stop_seq = false;
}

E2.p.prototype.update_input = function(slot, data)
{
	this.stop_seq = data;
};

E2.p.prototype.update_state = function()
{
	if(!this.stop_seq)
		return;
		
	if(E2.app.onStopClicked)
		E2.app.onStopClicked();
	else
		this.core.player.schedule_stop();
		
	this.stop_seq = false;
};
