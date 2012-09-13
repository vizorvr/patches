E2.plugins["knob_float_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits a user controllable float value between 0 and 1.';
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the knob is adjusted.', lo: 0, hi: 1, def: 0 } ];
	this.state = { val: 0.0 };
	this.knob = null;
	this.changed = true;
	
	this.reset = function()
	{
		self.changed = true;
	};
	
	this.set_rotation = function()
	{
		var rot = 'rotate(' + Math.floor(self.state.val * 270.0) + 'deg)';
		
		self.knob.css({
			'transform': rot,
			'-moz-transform': rot,
			'-webkit-transform': rot
		});
	};
	
	this.create_ui = function()
	{
		var shadow = make('div');
		self.knob = make('div');
		
		var knob_mouseup = function(data) { return function(e)
		{
			data.doc.unbind('mouseup.knob');
			data.doc.unbind('mousemove.knob');

			if(e.stopPropagation) e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			return false;
		}};

		var knob_mousemove = function(data) { return function(e)
		{
			var y_delta = e.pageY - data.last_y;
			var old_val = self.state.val;
			
			data.last_y = e.pageY;
			self.state.val -= y_delta * 0.01;
			self.state.val = self.state.val < 0.0 ? 0.0 : self.state.val > 1.0 ? 1.0 : self.state.val;
			
			if(self.state.val !== old_val)
			{
				self.set_rotation();
				self.changed = true;
			}

			if(e.stopPropagation) e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			return false;				
		}};
		
		var knob_mousedown = function(e)
		{
			var data = {
				doc: $(document),
				last_y: e.pageY
			};
			
			// Defer registration of event listeners until needed.
			data.doc.bind('mouseup.knob', knob_mouseup(data));
			data.doc.bind('mousemove.knob', knob_mousemove(data));
			
			if(e.stopPropagation) e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			return false;
		};
			
		shadow.css({
			'width': '32px',
			'height': '32px',
			'z-index': '3000',
			'background': 'url(\'images/knob/shadow.png\')'
		});
		
		self.knob.css({
			'width': '32px',
			'height': '32px',
			'z-index': '3001',
			'background': 'url(\'images/knob/knob.png\')'
		});

		shadow.append(self.knob);
		self.knob.mousedown(knob_mousedown);
		
		return shadow;
	};
	
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
	};
	
	this.update_output = function(slot)
	{
		return self.state.val;
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
			self.set_rotation();
	};
};
