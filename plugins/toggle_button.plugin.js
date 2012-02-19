g_Plugins["toggle_button"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'enabled', dt: core.datatypes.BOOL } ];
	this.state = { enabled: false };
	this.gl = core.renderer.context;
	this.texture = null;
	
	this.create_ui = function()
	{
		var inp = $('<input id="state" type="button" value="Enable" />');
		
		inp.click(function(e) 
		{
			self.state.enabled = !self.state.enabled;
			self.state_changed(inp);
		});
		
		return inp;
	};
	
	this.update_output = function(index)
	{
		return self.state.enabled;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			ui.prop('value', self.state.enabled ? 'Disable' : 'Enable');
	};
};
