g_Plugins["test_emitter"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'float', dt: core.datatypes.FLOAT },
		{ name: 'string', dt: core.datatypes.STRING },
		{ name: 'texture', dt: core.datatypes.TEXTURE },
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
	};

	this.update_state = function()
	{
	};
	
	this.update_value = function(value)
	{
		var is_null = value === null;
		
		self.label.css('background-color', is_null ? '#f00' : '#0f0');
		self.label.html(is_null ? 'No value' : '' + value); 
	};
};
