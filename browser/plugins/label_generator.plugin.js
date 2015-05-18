(function() {
var Label = E2.plugins.label_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Emits a string specified in an input field.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.TEXT, desc: 'The currently entered text.' }
	];
	
	this.state = { text: '' };
	this.core = core;
	this.node = node;
};
Label.prototype = Object.create(Plugin.prototype)

Label.prototype.reset = function()
{
}

Label.prototype.create_ui = function()
{
	var inp = $('<input type="text" value="1.0" style="width: 50px;" />');
	
	inp.css('border', '1px solid #999');
	inp.change(function(self) { return function()
	{
		self.undoableSetState('text', inp.val(), self.state.text)
	}}(this));
	
	this.etf = new ExpandableTextfield(this.node, inp, 7);
	return inp;
};

Label.prototype.update_output = function(slot)
{
	return this.state.text;
};

Label.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.text);
};

})();

