E2.plugins["color_display"] = function(core, node) {
	var self = this;
	
	this.desc = 'Displays the supplied color in a rectangle on the plugin.';
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color to be displayed.', def: 'White' }
	];
	this.output_slots = [];

	this.reset = function()
	{
		self.update_value(1.0, 1.0, 1.0);
	};
	
	this.create_ui = function()
	{
		self.label = make('span');
		self.label.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') 
		self.label.css('background-color', '#fff');
		self.label.css('border', '1px #aaa solid');
		
		return self.label;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.update_value(0);
	};

	this.update_input = function(slot, data)
	{
		self.update_value(data.rgba[0], data.rgba[1], data.rgba[2]);
	};
	
	this.update_value = function(r, g, b)
	{
		if(self.label)
			self.label.css('background-color', 'rgb(' + Math.round(r * 255.0) + ', ' + Math.round(g * 255.0) + ', ' + Math.round(b * 255.0) + ')');
	};
};
