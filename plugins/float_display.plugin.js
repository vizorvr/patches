g_Plugins["float_display"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [];

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
		self.label.html(value === null ? 'N/A' : value.toFixed(2));
	};
};
