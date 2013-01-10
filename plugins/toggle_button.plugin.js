E2.p = E2.plugins["toggle_button"] = function(core, node)
{
	this.desc = 'Toggle button that emits true and false as it is clicked.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True or false is emitted on the next update after the buttons has been clicked.', def: 'False' }
	];
	
	this.state = { enabled: false };
	this.node = node;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="state" type="button" value="Enable" />');
	
	inp.click(function(self) { return function(e) 
	{
		self.state.enabled = !self.state.enabled;
		self.state_changed(inp);
		
		// Since this changes our layout, update any attached connections.
		if(self.node.update_connections())
			E2.app.updateCanvas(true);
		
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.enabled;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.prop('value', this.state.enabled ? 'Disable' : 'Enable');
};
