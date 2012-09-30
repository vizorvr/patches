E2.plugins["light_type_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Select light type.';
	this.input_slots = [];
	this.output_slots = [ { name: 'type', dt: core.datatypes.FLOAT, desc: 'Emits the selected light type when requested or the selection state changes.', def: 'Point' } ];
	this.state = { type: Light.type.POINT };
	this.changed = true;
		
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.create_ui = function()
	{
		var lt = Light.type;
		var inp = $('<select />', { selectedIndex: 1 });
		
		$('<option />', { value: lt.POINT, text: 'Point' }).appendTo(inp);
		$('<option />', { value: lt.DIRECTIONAL, text: 'Directional' }).appendTo(inp);
		 
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
