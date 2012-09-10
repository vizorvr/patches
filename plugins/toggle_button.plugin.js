E2.plugins["toggle_button"] = function(core, node) {
	var self = this;
	
	this.desc = 'Toggle button that emits true and false as it is clicked.';
	this.input_slots = [];
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'True or false is emitted on the next update after the buttons has been clicked.', def: 'False' } ];
	this.state = { enabled: false };
	this.changed = true;
		
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.create_ui = function()
	{
		var inp = $('<input id="state" type="button" value="Enable" />');
		
		inp.click(function(e) 
		{
			self.state.enabled = !self.state.enabled;
			self.state_changed(inp);
			
			// Since this changes our layout, update any attached connections.
			node.update_connections();
			
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
		return self.state.enabled;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.prop('value', self.state.enabled ? 'Disable' : 'Enable');
	};
};
