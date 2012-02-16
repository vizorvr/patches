g_Plugins["annotation"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [];
	this.state = { text: '', width: 0, height: 0 };
	
	this.create_ui = function()
	{
		var inp = $('<textarea placeholder="Type text here" />');
		
		inp.css('font-size', '8pt');
		inp.css('border-color', '#999');
		
		inp.bind('blur', function()
		{
			self.state.text = $(this).val();
		});
		
		// Chrome doesn't handle resize properly for anything but the window object,
		// so we store the potentially altered size of the textarea on mouseup.
		inp.mouseup(function()
		{
			var ta = $(this);
			
			self.state.width = ta.width();
			self.state.height = ta.height();
		});

		return inp;
	};
	
	this.state_changed = function(ui)
	{
		if(ui && self.state.text !== '')
		{
			ui.val(self.state.text);
			
			if(self.state.width > 0)
				ui.css('width', self.state.width);
			
			if(self.state.height > 0)
				ui.css('height', self.state.height);
		}
	};
};
