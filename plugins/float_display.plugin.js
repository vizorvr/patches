E2.plugins["float_display"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [];

	this.reset = function()
	{
		self.update_value(null);
	}
	
	this.create_ui = function()
	{
		self.label = make('div');
		self.label.css('text-align', 'right'); 
		self.update_value(null);
		
		return self.label;
	};
	
	this.disconnect_input = function(index)
	{
		self.update_value(null);
	};

	this.update_input = function(index, data)
	{
		self.update_value(data);
	};
	
	this.update_value = function(value)
	{
		if(self.label)
			self.label.html(value === null ? '-' : value.toFixed(2));
	};
};
