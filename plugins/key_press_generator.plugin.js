E2.plugins["key_press_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true on the next update after the key matching the set filter has been pressed and false once after it has been released.';
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'signal', dt: core.datatypes.BOOL, desc: 'Emits true once when the set key is pressed.' }
	];	
	this.state = { key: 0 };
	
	this.update_output = function(slot)
	{
		return self.key_state;
	};
	
	this.create_ui = function()
	{
		var bm = core.renderer.blend_mode;
		var items = [
			[-1, '[Pick a key]'],
			[8, 'Backspace'], [9, 'Tab'], [13, 'Enter'],
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
		
		var inp = $('<select />', { selectedIndex: 4 });
		
		for(var i = 0, len = items.length; i < len; i++)
		{
			var item = items[i];
			$('<option />', { value: item[0], text: item[1] }).appendTo(inp);
		}
		 
		inp.change(function() 
		{
			self.state.key = parseInt(inp.val());
			self.state_changed(inp);
			self.key_state = false;
			self.updated = true;
			inp.blur();
		});
		
		return inp;
	};

	this.key_down = function(e)
	{
		debugger;
		
		if(e.originalEvent.keyCode !== self.state.key)
			return;
		
		self.key_state = true;
		self.updated = true;
	};
	
	this.key_up = function(e)
	{		
		if(e.originalEvent.keyCode !== self.state.key)
			return;
		
		self.key_state = false;
		self.updated = true;
	};

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.key_state = false;
			$(document).keydown(self.key_down);
			$(document).keyup(self.key_up);
		}
	};	
};
