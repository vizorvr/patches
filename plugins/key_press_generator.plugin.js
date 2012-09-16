E2.plugins["key_press_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits true on the next update after the key matching the set filter has been pressed and false once after it has been released.';
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'signal', dt: core.datatypes.BOOL, desc: 'Emits true once when the set key is pressed.' }
	];	
	this.state = { key: 0, type: 0 };
	
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
		
		var dom = make('div');
		var inp = $('<select id="key" title="Select key" />', { selectedIndex: 0 });
		var inp_type = $('<select id="o_type" title="Select output type" />', { selectedIndex: 0 });
		
		for(var i = 0, len = items.length; i < len; i++)
		{
			var item = items[i];
			$('<option />', { value: item[0], text: item[1] }).appendTo(inp);
		}
		 
		$('<option />', { value: 0, text: 'Impulse' }).appendTo(inp_type);
		$('<option />', { value: 1, text: 'Continuous' }).appendTo(inp_type);
		
		inp.change(function() 
		{
			self.state.key = parseInt(inp.val());
			self.reset_keystate();
			self.updated = true;
			inp.blur();
		});
		
		inp_type.change(function() 
		{
			self.state.type = parseInt(inp_type.val());
			self.updated = true;
			inp_type.blur();
		});

		inp.css('width', '100px');
		inp_type.css('width', '100px');
		
		dom.append(inp);
		dom.append(make('br'));
		dom.append(inp_type);
		
		return dom;
	};

	this.key_down = function(e)
	{
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

	this.reset_keystate = function()
	{
		self.last_state = self.key_state = false;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.state.type === 0 && self.key_state === self.last_state)
			self.updated = false;
		
		self.last_state = self.key_state;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.reset_keystate();
			$(document).keydown(self.key_down);
			$(document).keyup(self.key_up);
		}
		else
		{
			ui.find('#key').val(self.state.key);
			ui.find('#o_type').val(self.state.type);
		}
	};	
};
