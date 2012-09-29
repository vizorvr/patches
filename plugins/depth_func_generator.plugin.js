E2.plugins["depth_func_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Select z-buffer depth compare function.';
	this.input_slots = [];
	this.output_slots = [ { name: 'func', dt: core.datatypes.FLOAT, desc: 'Emits the selected depth function when requested or the selection state changes.', def: 'Diffuse color' } ];
	this.state = { depth_func: Material.depth_func.LEQUAL };
	this.changed = true;
		
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.create_ui = function()
	{
		var df = Material.depth_func;
		var inp = $('<select />', { selectedIndex: 4 });
		
		$('<option />', { value: df.NEVER, text: 'Never' }).appendTo(inp);
		$('<option />', { value: df.LESS, text: 'Less' }).appendTo(inp);
		$('<option />', { value: df.EQUAL, text: 'Equal' }).appendTo(inp);
		$('<option />', { value: df.LEQUAL, text: 'Less / equal' }).appendTo(inp);
		$('<option />', { value: df.GREATER, text: 'Greater' }).appendTo(inp);
		$('<option />', { value: df.NOTEQUAL, text: 'Not equal' }).appendTo(inp);
		$('<option />', { value: df.GEQUAL, text: 'Greater / equal' }).appendTo(inp);
		$('<option />', { value: df.Always, text: 'Always' }).appendTo(inp);
		 
		inp.change(function() 
		{
			self.state.depth_func = parseInt(inp.val());
			self.state_changed(inp);
			self.changed = true;
		});
		
		return inp;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
	};
	
	this.update_output = function(slot)
	{
		return self.state.depth_func;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.val('' + self.state.depth_func);
	};
};
