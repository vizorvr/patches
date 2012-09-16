E2.plugins["plot_display"] = function(core, node) {
	var self = this;
	
	this.desc = 'Displays the supplied coordiate on a XY plot.';
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The location on the x-axis.', lo: 0, hi: 1, def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The location on the y-axis.', lo: 0, hi: 1, def: 0 }
	];
	this.output_slots = [];
		
	this.reset = function()
	{
		self.coord = [0.0, 0.0];
		self.update_values();
	};
	
	this.create_ui = function()
	{
		var plot = make('div');
		
		plot.css({
			'width': '64px',
			'height': '64px',
			'background': 'url(\'images/plot_display/bg.png\')',
			'z-index': '1000',
			'position': 'relative'
		});
		
		var point = self.coord_div = make('div');
		
		point.css({
			'width': '7px',
			'height': '7px',
			'background': 'url(\'images/plot_display/point.png\')',
			'z-index': '1001',
			'position': 'absolute'
		});
		
		plot.append(point);
		self.reset();
		return plot;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.reset();
	};

	this.update_input = function(slot, data)
	{
		self.coord[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
		self.update_values();
	};
	
	this.update_values = function()
	{
		if(!self.coord_div)
			return;
		
		self.coord_div.css({
			'left': Math.round(self.coord[0] * 55.0), 
			'top': Math.round(55.0 - (self.coord[1] * 55.0)) + 2
		});
	};
};
