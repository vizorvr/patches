g_Plugins["const_float_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.state = { val: 1.0 };
	
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
		});
		
		return inp;
	};
	
	this.update_output = function(index)
	{
		return self.state.val;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.val('' + self.state.val);
	};
};
