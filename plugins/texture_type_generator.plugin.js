E2.p = E2.plugins["texture_type_generator"] = function(core, node)
{
	this.desc = 'Select texture type.';
	
	this.input_slots = [];
	
	this.output_slots = [ { name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected texture type when requested or the selection state changes.', def: 'Diffuse color' } ];
	
	this.state = { type: Material.texture_type.DIFFUSE_COLOR };
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var tt = Material.texture_type;
	var inp = $('<select />', { selectedIndex: 0 });
	
	$('<option />', { value: tt.DIFFUSE_COLOR, text: 'Diffuse color' }).appendTo(inp);
	$('<option />', { value: tt.EMISSION_COLOR, text: 'Emission color' }).appendTo(inp);
	$('<option />', { value: tt.SPECULAR_COLOR, text: 'Specular color' }).appendTo(inp);
	$('<option />', { value: tt.NORMAL, text: 'Normal' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.state.type = parseInt(inp.val());
		self.state_changed(inp);
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.type;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.type);
};
