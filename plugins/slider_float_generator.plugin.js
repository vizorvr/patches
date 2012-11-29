E2.p = E2.plugins["slider_float_generator"] = function(core, node)
{
	this.desc = 'Emits a user controllable float value between a specified minimum and maximum.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the slider is adjusted.', def: 0 }
	];
	
	this.state = { val: 0.0, min: 0.0, max: 1.0 };
	this.v_col = null;
	this.slider = null;
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	this.changed = true;
};

E2.p.prototype.create_ui = function()
{
	var table = make('table');
	var row = make('tr');
	var cols = [make('td'), make('td'), make('td')];
	
	var inp_lo = $('<input id="lo" type="text" style="width: 30px;" />');
	var inp_hi = $('<input id="hi" type="text" style="width: 30px;" />');
	var slider = make('div');
	
	slider.attr('id', 'sl');
	slider.css('width', '60px');
	slider.css('margin-right', '5px');
	slider.css('margin-left', '6px');
	table.css('width', '150px');
	table.addClass('pl_layout');
	inp_lo.css('border', '1px solid #999');
	inp_hi.css('border', '1px solid #999');
	
	var v_col = make('td');
	
	v_col.attr('colspan', '3');
	v_col.css('text-align', 'center');
	
	slider.slider( { slide: (function(self, v_col) { return function(event, ui)
	{
		self.update_value(ui.value);
		self.state.val = ui.value;
	}})(this, v_col), 
		min: this.state.min, 
		max: this.state.max, 
		val: this.state.val, 
		step: this.calc_step(), 
		animate: true 
	});
	
	table.append(row);
	row.append(cols[0]);
	row.append(cols[1]);
	row.append(cols[2]);

	cols[0].append(inp_lo);
	cols[1].append(slider);
	cols[2].append(inp_hi);
	
	var apply_constraints = function(self, st)
	{
		var bad = st.min > st.max;
		
		if(bad)
		{
			var t = st.min;
		
			st.min = st.max;
			st.max = t;
		}
	
		st.val = st.val < st.min ? st.min : st.val > st.max ? st.max : st.val;
		
		if(bad)
			self.state_changed(table);
	};
	
	var blur_handler = function(self, sender, slider) 
	{ 
		return function()
		{
			var nv = parseFloat(sender.val());
			var cv = slider.slider('option', 'value');
			var clo = slider.slider('option', 'min');
			var chi = slider.slider('option', 'max');
			var id = sender.attr('id');
			var nlo = clo;
			var nhi = chi;
			var st = self.state;
			
			if(id == 'lo')
			{
				slider.slider('option', 'min', nv);
				st.min = nv;
				nlo = nv;
				apply_constraints(self, st);
			}
			else if(id == 'hi')
			{
				slider.slider('option', 'max', nv);
				st.max = nv;
				nhi = nv;
				apply_constraints(self, st);
			}
				
			slider.slider('option', 'step', self.calc_step());
			slider.slider('option', 'value', st.val);
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
	return table;
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

E2.p.prototype.calc_step = function()
{
	return (this.state.max - this.state.min) / 100.0;
};

E2.p.prototype.update_value = function(value)
{
	this.changed = true;
	this.v_col.text(value.toFixed(2));
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.slider.slider('option', 'min', this.state.min);
		this.slider.slider('option', 'max', this.state.max);
		this.slider.slider('option', 'value', this.state.val);
		this.update_value(this.state.val);
		ui.find('#lo').val(this.state.min);
		ui.find('#hi').val(this.state.max);
	}
};
