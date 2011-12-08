g_Plugins["test_emitter"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [];

	this.create_ui = function()
	{
		self.label = make('div');
		self.update_value(null);
		return self.label;
	};
	
	this.update_input = function(index, data)
	{
		self.label.text(data);
	};

	this.update_state = function(delta_t)
	{
	};
	
	this.update_value = function(value)
	{
		var is_null = value === null;
		
		self.label.html(is_null ? 'N/A' : '' + value);
		self.label.css('text-align', 'right'); 
	};
};
