g_Plugins["led_display"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [];

	this.reset = function(ui)
	{
		self.update_value(0);
	};
	
	this.create_ui = function()
	{
		self.label = make('span');
		self.label.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') 
		self.update_value(0);
		
		return self.label;
	};
	
	this.disconnect_input = function(index, data)
	{
		self.update_value(0);
	};

	this.update_input = function(index, data)
	{
		self.update_value(data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data);
	};
	
	this.update_value = function(value)
	{
		if(self.label)
			self.label.css('background-color', 'rgb(' + Math.round(value * 255.0) + ', 40, 40)');
	};
};
