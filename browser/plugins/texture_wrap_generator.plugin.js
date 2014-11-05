E2.p = E2.plugins["texture_wrap_generator"] = function(core, node)
{
	this.desc = 'Emits a texture UV coordinate wrapping type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected UV coordinate wrapping type when requested or the selection state changes.', def: 'Repeat' }
	];
	
	this.gl = core.renderer.context;
	
	this.state = { type: this.gl.REPEAT };
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: '' + this.gl.CLAMP_TO_EDGE, text: 'Clamp' }).appendTo(inp);
	$('<option />', { value: '' + this.gl.REPEAT, text: 'Repeat' }).appendTo(inp);
	 
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
