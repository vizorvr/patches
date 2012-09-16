E2.plugins["matrix_display"] = function(core, node) {
	var self = this;
	
	this.desc = 'Displays the supplied matrix as a 4x4 grid of values.';
	this.input_slots = [ 
		{ name: 'matrix', dt: core.datatypes.TRANSFORM, desc: 'The input matrix to be displayed.' }
	];
	this.output_slots = [];
		
	this.reset = function()
	{
		self.cell_vals = ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
		self.update_values();
	};
	
	this.create_ui = function()
	{
		var table = make('table');
		
		self.columns = [];
		
		for(var r = 0; r < 4; r++)
		{
			var row = make('tr');
			
			for(var c = 0; c < 4; c++)
			{
				var col = make('td');
			
				col.html('-');
				col.css('text-align', 'right');
				col.css('padding-left', '10px');
				self.columns.push(col);
			
				row.append(col);
			}
			
			table.append(row);
		}		

		return table;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.reset();
	};

	this.update_input = function(slot, data)
	{
		var ofs = 0;
		
		for(var i = 0; i < 16; i++)
			self.cell_vals[i] = data[i].toFixed(2);
	
		self.update_values();
	};
	
	this.update_values = function()
	{
		if(!self.columns)
			return;
		
		for(var i = 0; i < 16; i++)
			self.columns[i].html(self.cell_vals[i]);
	};
};
