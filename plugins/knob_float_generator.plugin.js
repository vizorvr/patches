E2.p = E2.plugins["knob_float_generator"] = function(core, node)
{
	this.desc = 'Emits a user controllable float value between 0 and 1.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the knob is adjusted.', lo: 0, hi: 1, def: 0 }
	];

	this.state = { val: 0.0 };
	this.knob = null;
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	this.changed = true;
};

E2.p.prototype.set_rotation = function()
{
	var rot = 'rotate(' + Math.floor(this.state.val * 270.0) + 'deg)';
	
	this.knob.css({
		'transform': rot,
		'-moz-transform': rot,
		'-webkit-transform': rot
	});
};

E2.p.prototype.create_ui = function()
{
	var shadow = make('div');
	
	this.knob = make('div');
	
	var knob_mouseup = function(data) { return function(e)
	{
		data.doc.unbind('mouseup.knob');
		data.doc.unbind('mousemove.knob');

		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		return false;
	}};

	var knob_mousemove = function(self, data) { return function(e)
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
	
	var knob_mousedown = function(self) { return function(e)
	{
		var data = {
			doc: $(document),
			last_y: e.pageY
		};
		
		// Defer registration of event listeners until needed.
		data.doc.bind('mouseup.knob', knob_mouseup(data));
		data.doc.bind('mousemove.knob', knob_mousemove(self, data));
		
		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		return false;
	}};
		
	shadow.css({
		'width': '32px',
		'height': '32px',
		'z-index': '3000',
		'background': 'url(\'images/knob/shadow.png\')'
	});
	
	this.knob.css({
		'width': '32px',
		'height': '32px',
		'z-index': '3001',
		'background': 'url(\'images/knob/knob.png\')'
	});

	shadow.append(this.knob);
	this.knob.mousedown(knob_mousedown(this));
	
	return shadow;
};


E2.p.prototype.update_state = function(delta_t)
{
	if(this.changed)
	{
		this.changed = false;
		this.updated = true;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.val;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		this.set_rotation();
};
