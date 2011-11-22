g_Plugins["test_interval_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.v_col = null;
	this.state = { min: 0.0, max: 1.0, val: 0.0 };
	
	this.create_ui = function()
	{
		var table = make('table');
		var row = make('tr');
		var cols = [make('td'), make('td'), make('td')];
		
		var inp_lo = $('<input id="lo" type="text" value="0.0" style="width: 30px;" />');
		var inp_hi = $('<input id="hi" type="text" value="1.0" style="width: 30px;" />');
		var slider = make('div');
		
		slider.css('width', '100px');
		table.css('width', '160px');
		table.addClass('pl_layout');
		
		var v_col = make('td');
		
		v_col.attr('colspan', '3');
		
		slider.slider( { slide: (function(v_col) { return function(event, ui)
		{
			self.update_value(ui.value);
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
		
		var blur_handler = function(sender, slider) 
		{ 
			return function()
			{
				var nv = parseFloat(sender.val());
				var cv = slider.slider('option', 'val');
				var clo = slider.slider('option', 'min');
				var chi = slider.slider('option', 'max');
				var id = sender.attr('id');
				var nlo = clo;
				var nhi = chi;
				
				if(id == 'lo')
				{
					slider.slider('option', 'min', nv);
					self.state.min = nv;
					nlo = nv;
				}
				else if(id == 'hi')
				{
					slider.slider('option', 'max', nv);
					self.state.max = nv;
					nhi = nv;
				}
					
				slider.slider('option', 'step', self.calc_step());
				
				var rng = chi - clo;
				
				if(rng == 0.0)
					rng = 1.0;
				
				var v = (((cv - clo) / rng) * (nhi - nlo)) + nlo;
				
				// TODO: This needs more... Dur... Smartness! Map the current value to the new interval
				slider.slider('option', 'val', v);
				self.update_value(v);
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
		return table;
	};
	
	this.update_state = function()
	{
	}
	
	this.update_output = function(index)
	{
		return self.state.val;
	}
	
	this.calc_step = function()
	{
		return (self.state.max - self.state.min) / 100.0;
	};
	
	this.update_value = function(value)
	{
		self.state.val = value;
		self.v_col.text(value.toFixed(2));
	}
};
