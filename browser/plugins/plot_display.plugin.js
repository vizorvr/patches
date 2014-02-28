E2.p = E2.plugins["plot_display"] = function(core, node)
{
	this.desc = 'Displays the supplied coordiate on a XY plot.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The location on the x-axis.', lo: 0, hi: 1, def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The location on the y-axis.', lo: 0, hi: 1, def: 0 }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.coord = [0.0, 0.0];
	this.update_values();
};

E2.p.prototype.create_ui = function()
{
	var plot = make('div');
	
	plot.css({
		'width': '64px',
		'height': '64px',
		'background': 'url(\'images/plot_display/bg.png\')',
		'z-index': '1000',
		'position': 'relative'
	});
	
	var point = this.coord_div = make('div');
	
	point.css({
		'width': '7px',
		'height': '7px',
		'background': 'url(\'images/plot_display/point.png\')',
		'z-index': '1001',
		'position': 'absolute'
	});
	
	plot.append(point);
	this.reset();
	return plot;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.reset();
};

E2.p.prototype.update_input = function(slot, data)
{
	this.coord[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
	this.update_values();
};

E2.p.prototype.update_values = function()
{
	if(!this.coord_div)
		return;
	
	this.coord_div.css({
		'left': Math.round(this.coord[0] * 55.0), 
		'top': Math.round(55.0 - (this.coord[1] * 55.0)) + 2
	});
};
