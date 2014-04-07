E2.p = E2.plugins["reset_framebuffer_recorder"] = function(core, node)
{
	this.desc = 'Instruct the specified framedump server to clear its cache and start recording at from zero.';
	
	this.input_slots = [ 
		{ name: 'reset', dt: core.datatypes.BOOL, desc: 'Send true to this slot to reset the specified server.', def: false }
	];
	
	this.output_slots = [];
	this.url = 'http://' + window.location.host + '/fd/reset';
	this.clear = false;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.clear = data;
};

E2.p.prototype.update_state = function()
{
	if(!this.clear)
		return;

	$.get(this.url)
		.done(function()
		{
			msg('Framdumping reset to frame 0');
		})
		.fail(function()
		{
			msg('ERROR: Failed to reset the speficied framedumping server: ' + this.url);
		});
	
	this.clear = false;
};
