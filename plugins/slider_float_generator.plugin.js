E2.plugins["slider_float_generator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.state = { val: 0.0, min: 0.0, max: 1.0 };
	this.v_col = null;
	this.slider = null;
	this.changed = true;
	
	this.reset = function()
	{
		self.changed = true;
	};
	
	this.create_ui = function()
	{
		var table = make('table');
		var row = make('tr');
		var cols = [make('td'), make('td'), make('td')];
		
		var inp_lo = $('<input id="lo" type="text" value="0.0" style="width: 30px;" />');
		var inp_hi = $('<input id="hi" type="text" value="1.0" style="width: 30px;" />');
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
		
		slider.slider( { slide: (function(v_col) { return function(event, ui)
		{
			self.update_value(ui.value);
			self.state.val = ui.value;
		}})(v_col), 
			min: self.state.min, 
			max: self.state.max, 
			val: self.state.val, 
			step: self.calc_step(), 
			animate: true 
		});
		
		table.append(row);
		row.append(cols[0]);
		row.append(cols[1]);
		row.append(cols[2]);

		cols[0].append(inp_lo);
		cols[1].append(slider);
		cols[2].append(inp_hi);
		
		var apply_constraints = function(st)
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
		
		var blur_handler = function(sender, slider) 
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
					apply_constraints(st);
				}
				else if(id == 'hi')
				{
					slider.slider('option', 'max', nv);
					st.max = nv;
					nhi = nv;
					apply_constraints(st);
				}
					
				slider.slider('option', 'step', self.calc_step());
				slider.slider('option', 'value', st.val);
			}
		};
		
		inp_lo.blur(blur_handler(inp_lo, slider));
		inp_hi.blur(blur_handler(inp_hi, slider));
		
		var row2 = make('tr');
		
		row2.append(v_col);
		v_col.append();
		table.append(row2);
		
		self.v_col = v_col;
		self.update_value(0.0);
		self.slider = slider;
		return table;
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
	
	this.calc_step = function()
	{
		return (self.state.max - self.state.min) / 100.0;
	};
	
	this.update_value = function(value)
	{
		self.changed = true;
		self.v_col.text(value.toFixed(2));
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
		{
			self.slider.slider('option', 'min', self.state.min);
			self.slider.slider('option', 'max', self.state.max);
			self.slider.slider('option', 'value', self.state.val);
			self.update_value(self.state.val);
			ui.find('#lo').val(self.state.min);
			ui.find('#hi').val(self.state.max);
		}
	};
};
