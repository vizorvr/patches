(function(){
var Text = E2.plugins.const_text_generator = function(core, node) {
	AbstractPlugin.apply(this, arguments)
	this.desc = 'Enter a constant text string.';
	
	this.input_slots = [];
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	];
	
	this.state = { text: '', width: 0, height: 0 };
};
Text.prototype = Object.create(AbstractPlugin.prototype)

Text.prototype.reset = function()
{
	this.updated = true;
};

Text.prototype.create_ui = function() {
	var that = this
	var inp = $('<textarea placeholder="Type text here" />');
	
	inp.css({
		'font-size': '8pt',
		'border': '1px solid #999',
		'margin': '0px',
		'margin-top': '2px',
		'padding': '2px'
	});
	
	inp.on('change', function() {
		that.undoableSetState('text', inp.val(), that.state.text)
	})
	
	// Chrome doesn't handle resize properly for anything but the window object,
	// so we store the potentially altered size of the textarea on mouseup.
	inp.mouseup(function(self) { return function()
	{
		var ta = $(this);
		
		self.state.width = ta.width();
		self.state.height = ta.height();
	}}(this));
	
	return inp;
};

Text.prototype.update_output = function(slot)
{
	return this.state.text;
};

Text.prototype.state_changed = function(ui)
{
	var s = this.state;
	
	if(ui && s.text !== '')
	{
		ui.val(s.text);
		
		if(s.width > 0)
			ui.css('width', s.width);
		
		if(s.height > 0)
			ui.css('height', s.height);
	}
};
})()