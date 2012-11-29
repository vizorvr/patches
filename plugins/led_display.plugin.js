E2.p = E2.plugins["led_display"] = function(core, node)
{
	this.desc = 'Displays the supplied normalised float value as a red LED, with a 8 bit color granularity.';
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT, desc: 'Normalised input value.', lo: 0, hi: 1, def: 0 }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(0);
};

E2.p.prototype.create_ui = function()
{
	this.label = make('span');
	this.label.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') 
	this.update_value(0);
	
	return this.label;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.update_value(0);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.update_value(data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data);
};

E2.p.prototype.update_value = function(value)
{
	if(this.label)
		this.label.css('background-color', 'rgb(' + Math.round(value * 255.0) + ', 40, 40)');
};
