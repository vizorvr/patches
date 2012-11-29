E2.p = E2.plugins["matrix_display"] = function(core, node)
{
	this.desc = 'Displays the supplied matrix as a 4x4 grid of values.';
	
	this.input_slots = [ 
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The input matrix to be displayed.' }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.cell_vals = ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
	this.update_values();
};

E2.p.prototype.create_ui = function()
{
	var table = make('table');
	
	this.columns = [];
	
	for(var r = 0; r < 4; r++)
	{
		var row = make('tr');
		
		for(var c = 0; c < 4; c++)
		{
			var col = make('td');
		
			col.html('-');
			col.css('text-align', 'right');
			col.css('padding-left', '10px');
			this.columns.push(col[0]);
		
			row.append(col);
		}
		
		table.append(row);
	}		

	return table;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		this.reset();
};

E2.p.prototype.update_input = function(slot, data)
{
	var ofs = 0;
	
	for(var i = 0; i < 16; i++)
		this.cell_vals[i] = data[i].toFixed(2);

	this.update_values();
};

E2.p.prototype.update_values = function()
{
	if(!this.columns)
		return;
	
	for(var i = 0; i < 16; i++)
		this.columns[i].innerHTML = this.cell_vals[i];
};
