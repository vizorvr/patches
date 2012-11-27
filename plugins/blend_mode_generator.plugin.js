E2.p = E2.plugins["blend_mode_generator"] = function(core, node)
{
	this.desc = 'Select blend mode.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'blend mode', dt: core.datatypes.FLOAT, desc: 'Emits the selected blend mode when requested or the selection state changes.', def: 'Normal' }
	];
	
	this.state = { mode: Renderer.blend_mode.NORMAL };
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.create_ui = function()
{
	var bm = Renderer.blend_mode;
	var inp = $('<select />', { selectedIndex: 4 });
	
	$('<option />', { value: bm.NONE, text: 'None' }).appendTo(inp);
	$('<option />', { value: bm.ADDITIVE, text: 'Add' }).appendTo(inp);
	$('<option />', { value: bm.SUBTRACTIVE, text: 'Sub' }).appendTo(inp);
	$('<option />', { value: bm.MULTIPLY, text: 'Mul' }).appendTo(inp);
	$('<option />', { value: bm.NORMAL, text: 'Normal' }).appendTo(inp);
	 
	inp.change(function(self) { return function() 
	{
		self.state.mode = parseInt(inp.val());
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
	return this.state.mode;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.mode);
};
