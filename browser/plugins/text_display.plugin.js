E2.p = E2.plugins["text_display"] = function(core, node)
{
	this.desc = 'Display the supplied text value on the plugin surface.';
	
	this.input_slots = [ 
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'Input text to be displayed.', def: '' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(null);
}

E2.p.prototype.create_ui = function()
{
	this.label = make('div');
	
	return this.label;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.update_value('');
};

E2.p.prototype.update_input = function(slot, data)
{
	this.update_value(data);
};

E2.p.prototype.update_value = function(value)
{
	if(this.label)
		this.label[0].innerHTML = value;
};
