E2.p = E2.plugins["slider_float_generator"] = function(core, node)
{
	this.desc = 'Emits a user controllable float value between two specified values.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the slider is adjusted.', def: 0 }
	];
	
	this.state = { val: 0.0, min: 0.0, max: 1.0 };
	
	this.node = node;
	this.v_col = null;
	this.slider = null;
	this.handle = null;
	this.pos = 0;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var table = make('table');
	var row = make('tr');
	var cols = [make('td'), make('td'), make('td')];
	
	var inp_lo = $('<input id="lo" type="text" style="width: 30px;" />');
	var inp_hi = $('<input id="hi" type="text" style="width: 30px;" />');
	var slider = make('div');
	var handle = make('div');
	
	var slider_mouseup = function(data) { return function(e)
	{
		document.removeEventListener('mouseup', data.mouseup);
		document.removeEventListener('mousemove', data.mousemove);

		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		return false;
	}};

	var slider_mousemove = function(self, data) { return function(e)
	{
		var x_delta = e.pageX - data.last_x;
		var rng = self.state.max - self.state.min;
		
		if(Math.abs(rng) > 0.0001)
		{
			data.last_x = e.pageX;
		
			var new_val = self.pos + x_delta;
		
			new_val = new_val < 0.0 ? 0.0 : new_val > 60.0 ? 60.0 : new_val;
		
			if(self.state.val !== new_val)
			{
				var mix = new_val / 60.0;
			
				self.pos = Math.floor(new_val);
				self.state.val = ((1.0 - mix) * self.state.min) + (mix * self.state.max);
				handle[0].style.left = '' + self.pos + 'px';
				self.update_value(self.state.val);
				self.updated = true;
			}
		}
		
		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		return false;				
	}};
	
	var slider_mousedown = function(self, il, ih, handle) { return function(e)
	{
		var data = {
			last_x: e.pageX,
			handle: handle,
		};
		
		// Defer registration of event listeners until needed.
		data.mouseup = slider_mouseup(data);
		data.mousemove = slider_mousemove(self, data);
		document.addEventListener('mouseup', data.mouseup);
		document.addEventListener('mousemove', data.mousemove);
		
		il.blur();
		ih.blur();
		
		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		return false;
	}};
	
	slider.addClass('slider slider-horizontal ui-widget corner-all');
	slider.css({ 'width': '60px', 'margin-left': '8px', 'margin-right': '8px' });
	handle.addClass('slider-handle state-hover corner-all');
	handle[0].style.left = '0px';
	handle[0].addEventListener('mousedown', slider_mousedown(this, inp_lo, inp_hi, handle));
	
	slider.append(handle);
	
	table.css('width', '150px');
	table.addClass('pl_layout');
	inp_lo.css('border', '1px solid #999');
	inp_hi.css('border', '1px solid #999');
	
	inp_lo.etf = new ExpandableTextfield(this.node, inp_lo, 3);
	inp_hi.etf = new ExpandableTextfield(this.node, inp_hi, 3);
	
	var v_col = make('td');
	
	v_col.attr('colspan', '3');
	v_col.css('text-align', 'center');
	
	table.append(row);
	row.append(cols[0]);
	row.append(cols[1]);
	row.append(cols[2]);

	cols[0].append(inp_lo);
	cols[1].append(slider);
	cols[2].append(inp_hi);
	
	var blur_handler = function(self, sender, slider) 
	{ 
		return function()
		{
			var id = sender.attr('id');
			var st = self.state;
			var safe_parse = function(def, str)
			{
				try 
				{ 
					var v = parseFloat(str);
			
					if(!isNaN(v))
						return v;
				}
				catch(e) 
				{
				}
				
				return def;
			};
								
			if(id === 'lo')
			{
				st.min = safe_parse(st.min, sender.val());
				sender.val('' + st.min);
			}
			else if(id === 'hi')
			{
				st.max = safe_parse(st.max, sender.val());
				sender.val('' + st.max).change();
			}
			
			sender.etf.update();

			var l = Math.min(st.min, st.max), h = Math.max(st.min, st.max);
			var rng = Math.abs(st.max - st.min);
			
			st.val = st.val < l ? l : st.val > h ? h : st.val;
			self.pos = rng < 0.0001 ? 0.0 : ((Math.abs(st.val - st.min) / rng) * 60.0);
			self.handle[0].style.left = '' + self.pos + 'px';
			
			self.update_value(self.state.val);
		}
	};
	
	inp_lo.blur(blur_handler(this, inp_lo, slider));
	inp_hi.blur(blur_handler(this, inp_hi, slider));
	
	var row2 = make('tr');
	
	row2.append(v_col);
	v_col.append();
	table.append(row2);
	
	this.v_col = v_col;
	this.update_value(0.0);
	this.slider = slider;
	this.handle = handle;
	return table;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.val;
};

E2.p.prototype.update_value = function(value)
{
	this.updated = true;
	this.v_col.text(value.toFixed(2));
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.update_value(this.state.val);
		ui.find('#lo').val(this.state.min);
		ui.find('#hi').val(this.state.max);
		this.pos = ((this.state.val - this.state.min) / Math.abs(this.state.max - this.state.min)) * 60.0;
		this.handle[0].style.left = '' + this.pos + 'px';
	}
};
