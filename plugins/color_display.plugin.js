E2.p = E2.plugins["color_display"] = function(core, node)
{
	this.desc = 'Displays the supplied color in a rectangle on the plugin.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color to be displayed.', def: 'White' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.update_value(1.0, 1.0, 1.0);
};

E2.p.prototype.create_ui = function()
{
	this.label = make('span');

	this.label.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') 
	this.label.css({ 'background-color': '#fff', 'border': '1px #aaa solid' });
	
	return this.label;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.update_value(0);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.update_value(data.rgba[0], data.rgba[1], data.rgba[2]);
};

E2.p.prototype.update_value = function(r, g, b)
{
	if(this.label)
		this.label.css('background-color', 'rgb(' + Math.round(r * 255.0) + ', ' + Math.round(g * 255.0) + ', ' + Math.round(b * 255.0) + ')');
};
