E2.p = E2.plugins["label_generator"] = function(core, node)
{
	this.desc = 'Emits a string specified in an input field.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.TEXT, desc: 'The currently entered text.' }
	];
	
	this.state = { text: '' };
	this.core = core;
	this.node = node;
};

E2.p.prototype.reset = function()
{
}

E2.p.prototype.create_ui = function()
{
	var inp = $('<input type="text" value="1.0" style="width: 50px;" />');
	
	inp.css('border', '1px solid #999');
	inp.change(function(self) { return function(e)
	{
		self.state.text = inp.val();
		self.updated = true;
	}}(this));
	
	ExpandableTextfield(this.node, inp, 7);
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.text;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.text);
};
