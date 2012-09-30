E2.plugins["texture_type_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Select texture type.';
	this.input_slots = [];
	this.output_slots = [ { name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected texture type when requested or the selection state changes.', def: 'Diffuse color' } ];
	this.state = { type: Material.texture_type.DIFFUSE_COLOR };
	this.changed = true;
		
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.create_ui = function()
	{
		var tt = Material.texture_type;
		var inp = $('<select />', { selectedIndex: 0 });
		
		$('<option />', { value: tt.DIFFUSE_COLOR, text: 'Diffuse color' }).appendTo(inp);
		$('<option />', { value: tt.EMISSION_COLOR, text: 'Emission color' }).appendTo(inp);
		$('<option />', { value: tt.SPECULAR_COLOR, text: 'Specular color' }).appendTo(inp);
		$('<option />', { value: tt.NORMAL, text: 'Normal' }).appendTo(inp);
		 
		inp.change(function() 
		{
			self.state.type = parseInt(inp.val());
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
		return self.state.type;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.val('' + self.state.type);
	};
};
