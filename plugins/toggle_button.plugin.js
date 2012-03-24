E2.plugins["toggle_button"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'enabled', dt: core.datatypes.BOOL } ];
	this.state = { enabled: false };
	
	this.create_ui = function()
	{
		var inp = $('<input id="state" type="button" value="Enable" />');
		
		inp.click(function(e) 
		{
			self.state.enabled = !self.state.enabled;
			self.state_changed(inp);
			
			// Since this changes our layout, update any attached connections.
			node.update_connections();
			E2.app.updateCanvas();
		});
		
		return inp;
	};
	
	this.update_output = function(slot)
	{
		return self.state.enabled;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.prop('value', self.state.enabled ? 'Disable' : 'Enable');
	};
};
