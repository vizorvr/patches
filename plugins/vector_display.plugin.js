E2.plugins["vector_display"] = function(core, node) {
	var self = this;
	
	this.desc = 'Displays the supplied vector as a three-cell row of values.';
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The vector to be displayed.' }
	];
	
	this.output_slots = [];

	this.reset = function()
	{
		self.vec = ['-', '-', '-'];
		self.update_values();
	};
	
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
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.reset(null);
	};

	this.update_input = function(slot, data)
	{
		for(var i = 0; i < 3; i++)
			self.vec[i] = data[i].toFixed(2);
	
		self.update_values();
	};
	
	this.update_values = function()
	{
		if(!self.columns)
			return;
		
		for(var i = 0; i < 3; i++)
			self.columns[i].html(self.vec[i])
	};
};
