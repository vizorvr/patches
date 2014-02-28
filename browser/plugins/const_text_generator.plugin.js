E2.p = E2.plugins["const_text_generator"] = function(core, node)
{
	this.desc = 'Enter a constant text string.';
	
	this.input_slots = [];
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The currently entered text.', def: 'Empty string' }
	];
	
	this.state = { text: '', width: 0, height: 0 };
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<textarea placeholder="Type text here" />');
	
	inp.css({
		'font-size': '8pt',
		'border': '1px solid #999',
		'margin': '0px',
		'margin-top': '2px',
		'padding': '2px'
	});
	
	inp.bind('blur', function(self) { return function()
	{
		self.state.text = $(this).val();
		self.updated = true;
	}}(this));
	
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

E2.p.prototype.update_output = function(slot)
{
	return this.state.text;
};

E2.p.prototype.state_changed = function(ui)
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
