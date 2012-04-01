E2.plugins["const_float_generator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.state = { val: 1.0 };
	this.changed = true;
	
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.create_ui = function()
	{
		var inp = $('<input type="text" value="1.0" style="width: 50px;" />');
		
		inp.css('border', '1px solid #999');
		inp.change(function(e) {
			try 
			{ 
				self.state.val = parseFloat(inp.val()); 
			}
			catch(e) 
			{
				self.state.val = 1.0;
				inp.val('1.0');
			}
			
			 // Don't set the updated flag directly from an asynchronous function.
			 // This could lead to aliasing with the core update logic.
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
		return self.state.val;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.val('' + self.state.val);
	};
};
