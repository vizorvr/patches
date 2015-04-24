(function(){
Toggle = E2.plugins.toggle_button = function(core, node)
{
	Plugin.apply(this, arguments)
	this.desc = 'Toggle button that emits true and false as it is clicked.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True or false is emitted on the next update after the buttons has been clicked.', def: 'False' }
	];
	
	this.state = { enabled: false };
	this.core = core;
	this.node = node;
};
Toggle.prototype = Object.create(Plugin.prototype)

Toggle.prototype.reset = function()
{
};

Toggle.prototype.create_ui = function()
{
	var that = this
	var inp = makeButton('Off');
	
	inp.click(function(e) {
		that.undoableSetState('enabled', !that.state.enabled, that.state.enabled)
	})
	
	return inp;
};

Toggle.prototype.update_output = function(slot)
{
	return this.state.enabled;
};

Toggle.prototype.state_changed = function(ui)
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
			
		// this.node.update_connections();
	}
};
})()