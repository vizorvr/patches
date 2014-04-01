E2.p = E2.plugins["object_display"] = function(core, node)
{
	this.desc = 'Displays Objects and Arrays.';
	
	this.input_slots = [ 
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object to be analyzed.' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(null);
}

E2.p.prototype.create_ui = function()
{
	this.label = make('pre');
	this.update_value(null);
	
	return this.label;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.update_value(null);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.update_value(data);
};

E2.p.prototype.update_value = function(value)
{
	if (this.label)
		this.label.html(JSON.stringify(value, null, '  '))
};
