E2.p = E2.plugins["vector_display"] = function(core, node)
{
	this.desc = 'Displays the supplied vector as a three-cell row of values.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The vector to be displayed.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.vec = ['-', '-', '-'];
	this.update_values();
};

E2.p.prototype.create_ui = function()
{
	var table = make('table');
	var row = make('tr');
	var css = { 'text-align': 'right', 'padding-left': '10px' };
	
	this.columns = [make('td'), make('td'), make('td')];

	for(var i = 0; i < 3; i++)
	{
		var c = this.columns[i];
		
		c.text(this.vec[i]);
		c.css(css);
		row.append(c);
	}
	
	table.append(row);

	return table;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
		self.reset(null);
};

E2.p.prototype.update_input = function(slot, data)
{
	for(var i = 0; i < 3; i++)
		this.vec[i] = data[i].toFixed(2);

	this.update_values();
};

E2.p.prototype.update_values = function()
{
	if(!this.columns)
		return;
	
	for(var i = 0; i < 3; i++)
		this.columns[i].text(this.vec[i])
};
