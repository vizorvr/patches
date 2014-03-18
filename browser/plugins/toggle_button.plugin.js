E2.p = E2.plugins["toggle_button"] = function(core, node)
{
	this.desc = 'Toggle button that emits true and false as it is clicked.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True or false is emitted on the next update after the buttons has been clicked.', def: 'False' }
	];
	
	this.state = { enabled: false };
	this.core = core;
	this.node = node;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Off');
	
	inp.click(function(self) { return function(e) 
	{
		self.state.enabled = !self.state.enabled;
		self.state_changed(inp);
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
	{
		this.core.add_aux_style('toggle-button/style.css');

		ui.html(this.state.enabled ? 'On' : 'Off');
		ui.addClass('toggle_btn');
		
		if(!this.state.enabled)
			ui.addClass('toggle_btn_off');
		else
			ui.removeClass('toggle_btn_off');
	}
};
