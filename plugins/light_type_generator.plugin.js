E2.p = E2.plugins["light_type_generator"] = function(core, node)
{
	this.desc = 'Select light type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected light type when requested or the selection state changes.', def: 'Point' }
	];
	
	this.state = { type: Light.type.POINT };
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.create_ui = function()
{
	var lt = Light.type;
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: lt.POINT, text: 'Point' }).appendTo(inp);
	$('<option />', { value: lt.DIRECTIONAL, text: 'Directional' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.state.type = parseInt(inp.val());
		self.state_changed(inp);
		self.changed = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.changed)
	{
		this.changed = false;
		this.updated = true;
	}
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
