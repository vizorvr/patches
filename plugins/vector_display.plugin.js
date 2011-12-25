g_Plugins["vector_display"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR }
	];
	
	this.output_slots = [];
	this.vec = ['-', '-', '-'];
	
	this.create_ui = function()
	{
		self.table = make('table');
		self.row = make('tr');
		self.columns = [make('td'), make('td'), make('td')];
		
		for(var i = 0; i < 3; i++)
		{
			var c = self.columns[i];
			
			c.html(self.vec[i]);
			c.css('text-align', 'right');
			c.css('padding-left', '10px');
			self.row.append(c);
		}
		
		self.table.append(self.row);

		return self.table;
	};
	
	this.disconnect_input = function(index)
	{
		self.vec = ['-', '-', '-'];
		self.update_values();
	};

	this.update_input = function(index, data)
	{
		for(var i = 0; i < 3; i++)
			self.vec[i] = data[i].toFixed(2);
	
		self.update_values();
	};
	
	this.update_values = function()
	{
		for(var i = 0; i < 3; i++)
			self.columns[i].html(self.vec[i])
	};
};
