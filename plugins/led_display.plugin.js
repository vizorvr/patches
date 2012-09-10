E2.plugins["led_display"] = function(core, node) {
	var self = this;
	
	this.desc = 'Displays the supplied normalised float value as a red LED, with a 8 bit color granularity.';
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT, desc: 'Normalised input value.', lo: 0, hi: 1, def: 0 }
	];
	this.output_slots = [];

	this.reset = function()
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
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.update_value(0);
	};

	this.update_input = function(slot, data)
	{
		self.update_value(data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data);
	};
	
	this.update_value = function(value)
	{
		if(self.label)
			self.label.css('background-color', 'rgb(' + Math.round(value * 255.0) + ', 40, 40)');
	};
};
