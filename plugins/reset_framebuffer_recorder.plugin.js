E2.p = E2.plugins["reset_framebuffer_recorder"] = function(core, node)
{
	this.desc = 'Instruct the specified framedump server to clear its cache and start recording at from zero.';
	
	this.input_slots = [ 
		{ name: 'reset', dt: core.datatypes.BOOL, desc: 'Send true to this slot to reset the specified server.', def: false },
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'URL of the recording server.' }
	];
	
	this.output_slots = [];
	this.clear = false;
};

E2.p.prototype.reset = function()
{
	this.url = null;
}

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
	{
		if(slot.index === 0)
			this.clear = false;
		else if(slot.index === 1)
			this.url = null;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0 && data)
		this.clear = true;
	else if(slot.index === 1)
		this.url = data;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(!this.clear || !this.url || this.url.length < 1)
		return;
	
	var url = this.url;
	
	if(url[url.length-1] != '/')
		url += '/';
		
	url += 'reset';
	
	$.ajax({
		url: url,
		async: false,
		contentType: false,
		processData: false,
		type: 'GET',
		success: function(data)
		{
			msg('Framdumping reset to frame 0');
		},
		error: function()
		{
			msg('ERROR: Failed to reset the speficied framedumping server: ' + this.url);
		}
	});
	
	this.clear = false;
};
