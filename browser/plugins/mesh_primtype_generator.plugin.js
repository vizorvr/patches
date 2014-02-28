E2.p = E2.plugins["mesh_primtype_generator"] = function(core, node)
{
	this.desc = 'Select mesh primitive type.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected mesh primitive type when requested or the selection state changes.', def: 'Triangles' }
	];
	
	this.gl = core.renderer.context;
	
	this.state = { type: this.gl.TRIANGLES };
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 4 });
	
	$('<option />', { value: this.gl.POINTS, text: 'Points' }).appendTo(inp);
	$('<option />', { value: this.gl.LINES, text: 'Lines' }).appendTo(inp);
	$('<option />', { value: this.gl.LINE_STRIP, text: 'Line strip' }).appendTo(inp);
	$('<option />', { value: this.gl.LINE_LOOP, text: 'Line loop' }).appendTo(inp);
	$('<option />', { value: this.gl.TRIANGLES, text: 'Triangles' }).appendTo(inp);
	$('<option />', { value: this.gl.TRIANGLE_STRIP, text: 'Triangle strip' }).appendTo(inp);
	$('<option />', { value: this.gl.TRIANGLE_FAN, text: 'Triangle fan' }).appendTo(inp);
	 
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
