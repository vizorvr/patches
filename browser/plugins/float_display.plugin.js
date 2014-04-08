E2.p = E2.plugins["float_display"] = function(core, node)
{
	this.desc = 'Display the supplied float value on the plugin surface.';
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT, desc: 'Input value to be displayed.', def: null }
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
	this.label.css('text-align', 'right'); 
	this.update_value(null);
	
	return this.label;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.update_value(data);
};

E2.p.prototype.update_value = function(value)
{
	if(this.label)
		this.label[0].innerHTML = value === null ? '-' : value.toFixed(2);
};
