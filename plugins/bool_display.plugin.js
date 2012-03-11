E2.plugins["bool_display"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL }
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
	
	this.disconnected = function(slot)
	{
		self.update_value(null);
	};

	this.update_input = function(slot, data)
	{
		self.update_value(data);
	};
	
	this.update_value = function(value)
	{
		if(self.label)
			self.label.html(value === null ? '-' : value ? 'True' : 'False');
	};
};
