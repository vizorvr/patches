E2.p = E2.plugins["bool_display"] = function(core, node)
{
	this.desc = 'Displays the text \'True\' or \'False\' depending on the state of the supplied bool or \'-\', if no data is being received.';
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The input boolean to display.' }
	];
	
	this.output_slots = [];
	
	this.label = null;
};

E2.p.prototype.reset = function()
{
	this.update_value(null);
}

E2.p.prototype.create_ui = function()
{
	this.label = make('div');
	this.label.css('text-align', 'right'); 
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
	if(this.label)
		this.label.text(value === null ? '-' : value ? 'True' : 'False');
};
