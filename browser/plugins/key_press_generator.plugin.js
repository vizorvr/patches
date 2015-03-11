E2.p = E2.plugins["key_press_generator"] = function(core, node)
{
	this.desc = 'Emits true on the next update after the key matching the set filter has been pressed and false once after it has been released.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'signal', dt: core.datatypes.BOOL, desc: 'Emits true once when the set key is pressed.' }
	];	
	
	this.state = { key: 0, type: 0 };
};

E2.p.prototype.update_output = function(slot)
{
	return this.key_state;
};

E2.p.prototype.create_ui = function()
{
	var items = [
		[-1, '[Pick a key]'],
		[8, 'Backspace'], [9, 'Tab'], [13, 'Enter'],
		[32, 'Space'],
		[33, 'Page up'], [34, 'Page down'], [35, 'End'],
		[36, 'Home'], [37, 'Left arrow'], [38, 'Up arrow'],
		[39, 'Right arrow'], [40, 'Down arrow'], [45, 'Insert'], [46, 'Delete'],
		[48, '0'], [49, '1'], [50, '2'],
		[51, '3'], [52, '4'], [53, '5'],
		[54, '6'], [55, '7'], [56, '8'],
		[57, '9'], 
		[65, 'a'],
		[66, 'b'], [67, 'c'], [68, 'd'],
		[69, 'e'], [70, 'f'], [71, 'g'],
		[72, 'h'], [73, 'i'], [74, 'j'],
		[75, 'k'], [76, 'l'], [77, 'm'],
		[78, 'n'], [79, 'o'], [80, 'p'],
		[81, 'q'], [82, 'r'], [83, 's'],
		[84, 't'], [85, 'u'], [86, 'v'],
		[87, 'w'], [88, 'x'], [89, 'y'],
		[90, 'z']
	];
	
	var dom = make('div');
	var inp = $('<select id="key" title="Select key" />', { selectedIndex: 0 });
	var inp_type = $('<select id="o_type" title="Select output signal type" />', { selectedIndex: 0 });
	
	for(var i = 0, len = items.length; i < len; i++)
	{
		var item = items[i];
		$('<option />', { value: item[0], text: item[1] }).appendTo(inp);
	}
	 
	$('<option />', { value: 0, text: 'Impulse' }).appendTo(inp_type);
	$('<option />', { value: 1, text: 'Continuous' }).appendTo(inp_type);
	
	inp.change(function(self) { return function() 
	{
		self.state.key = parseInt(inp.val());
		self.reset_keystate();
		self.updated = true;
		inp.blur();
	}}(this));
	
	inp_type.change(function(self) { return function() 
	{
		self.state.type = parseInt(inp_type.val());
		self.updated = true;
		inp_type.blur();
	}}(this));

	inp.css('width', '100px');
	inp_type.css('width', '100px');
	
	dom.append(inp);
	dom.append(make('br'));
	dom.append(inp_type);
	
	return dom;
};

E2.p.prototype.key_down = function(self) { return function(e)
{
	if(e.originalEvent.keyCode !== self.state.key)
		return;
	
	self.key_state = true;
	self.updated = true;
}};

E2.p.prototype.key_up = function(self) { return function(e)
{		
	if(e.originalEvent.keyCode !== self.state.key)
		return;
	
	self.key_state = false;
	self.updated = true;
}};

E2.p.prototype.reset_keystate = function()
{
	this.last_state = this.key_state = false;
};

E2.p.prototype.update_state = function()
{
	if(this.state.type === 0 && this.key_state === this.last_state)
		this.updated = false;
	
	this.last_state = this.key_state;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.reset_keystate();
		$(document).keydown(this.key_down(this));
		$(document).keyup(this.key_up(this));
	}
	else
	{
		ui.find('#key').val(this.state.key);
		ui.find('#o_type').val(this.state.type);
	}
};
