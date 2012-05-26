E2.plugins["color_picker"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'color', dt: core.datatypes.COLOR } ];
	this.state = { hue: 0.0, sat: 0.0, lum: 1.0 };
	this.changed = true;
	
	this.reset = function()
	{
		self.changed = true;
	};
	
	this.create_ui = function()
	{
		var c = this.div = make('div');
		var i = make('img');
		var s = make('img');
		var h = make('img');
		var hs = make('img');
	
		c.css('width', '130px');
		c.css('height', '102px');
		c.css('margin-right', '10px');
		c.css('position', 'relative');
		h.attr('id', 'cont');
		
		h.css('width', '14px');
		h.css('height', '100px');
		h.css('border', '1px solid #888');
		h.css('cursor', 'crosshair');
		h.css('z-index', '100');
		// h.css('float', 'right');
		hs.css('position', 'absolute');
		hs.css('top', '0px');
		hs.css('left', '114px');
		h.attr('src', 'images/color_picker/hue.png');
		h.attr('id', 'hue');

		s.css('width', '11px');
		s.css('height', '11px');
		s.css('cursor', 'crosshair');
		s.css('z-index', '101');
		s.css('position', 'absolute');
		s.attr('src', 'images/color_picker/select.gif');
		s.attr('id', 'sel');

		hs.css('width', '20px');
		hs.css('height', '5px');
		hs.css('cursor', 'crosshair');
		hs.css('z-index', '101');
		hs.css('position', 'absolute');
		hs.attr('src', 'images/color_picker/hue-select.png');
		hs.attr('id', 'hue-sel');

		i.css('width', '100px');
		i.css('height', '100px');
		i.css('border', '1px solid #888');
		i.css('cursor', 'crosshair');
		i.css('z-index', '100');
		i.css('background-color', '#f00');
		i.attr('src', 'images/color_picker/picker.png');
		i.attr('id', 'img');

		c.append(i);
		c.append(s);
		c.append(h);
		c.append(hs);
	
		var c_down = function(c, i, s) { return function(e) 
		{ 
			self.color_drag = true;
			self.update_picker_ev(c, i, s, e);
		}}(c, i, s);
	
		var c_up = function(e) { e.preventDefault(); self.color_drag = false; };
	
		var c_move = function(c, i, s) { return function(e)
		{
			self.update_picker_ev(c, i, s, e);
			self.color_clipped = self.clip(e, i);
		}}(c, i, s);
	
		s.mousedown(c_down);
		s.mouseup(c_up);
		s.mousemove(c_move);

		i.mousedown(c_down);
		i.mouseup(c_up);
		i.mousemove(c_move);
	
		var h_down = function(p, h, hs) { return function(e) 
		{ 
			e.preventDefault(); 
			self.hue_drag = true;
			self.update_hue_ev(e, p, h, hs);
		}}(i, h, hs);
	
		var h_up = function(e) { e.preventDefault(); self.hue_drag = false; };
	
		var h_move = function(p, h, hs) { return function(e)
		{
			self.update_hue_ev(e, p, h, hs);
			self.hue_clipped = self.clip(e, h);
		}}(i, h, hs);
	
		hs.mousedown(h_down);
		hs.mouseup(h_up);
		hs.mousemove(h_move);

		h.mousedown(h_down);
		h.mouseup(h_up);
		h.mousemove(h_move);

		return c;
	};
	
	this.update_output = function(slot)
	{
		return self.color;
	};

	this.update_value = function()
	{
		var sat = self.state.sat;
		var lum = self.state.lum;
		var nc = [self.hue_rgb[0] / 255.0, self.hue_rgb[1] / 255.0, self.hue_rgb[2] / 255.0];
		var lc = lum * (1.0 - sat);
		var cnv = function(cmp) { return lc + (nc[cmp] * lum * sat); };
		var cnv2 = function(cmp) { return Math.floor(nc[cmp] * 255.0); };

		nc = [cnv(0), cnv(1), cnv(2)];
		var rgb = self.color ? self.color.rgba : null;
		
		if(!rgb || rgb[0] !== nc[0] || rgb[1] !== nc[1] || rgb[2] !== nc[2])
		{
			
			self.color = new Color(nc[0], nc[1], nc[2], 1.0);
			self.changed = true;
		}
		
		nc = [cnv2(0), cnv2(1), cnv2(2)];
		
		if(self.div)
			self.div.css('background-color', 'rgb(' + nc[0] + ', ' + nc[1] + ', ' + nc[2] + ')');
	};

	this.update_picker_ev = function(c, i, s, e)
	{
		e.preventDefault();

		if(!self.color_drag || self.color_clipped)
			return;

		var i_o = i.offset();

		self.state.sat = (e.pageX - i_o.left) / 100.0;
		self.state.lum = 1.0 - ((e.pageY - i_o.top) / 100.0);
		
		self.update_picker(c, s);
	};
	
	this.update_picker = function(c, s)
	{
		s.css('left', Math.floor((self.state.sat * 100.0)) - 5);
		s.css('top', Math.floor((1.0 - self.state.lum) * 100.0) - 5);

		self.update_value(c);
	};

	this.update_hue_ev = function(e, p, h, hs)
	{
		e.preventDefault();

		if(!self.hue_drag || self.hue_clipped)
			return;

		self.state.hue = (e.pageY - h.offset().top) / 100.0;
		self.update_hue(p, h, hs);
	};
	
	this.update_hue = function(p, h, hs)
	{
		var hue = 1.0 - self.state.hue;

		var t2 = 1.0;
		var t1 = 0.0;		
		var t3 = [hue + 1.0 / 3.0, hue, hue - 1.0 / 3.0];
		var c = [0, 0, 0];

		for(var i = 0; i < 3; i++)
		{
			if(t3[i] < 0.0)
				t3[i] += 1.0;
			else if(t3[i] > 1.0)
				t3[i] -= 1.0;
	
			var t3v = t3[i];
				
			if(6.0 * t3v < 1.0)
				c[i] = t3v * 6.0;
			else if(2.0 * t3v < 1.0)
				c[i] = 1.0;
			else if(3.0 * t3v < 2.0)
				c[i] = ((2.0 / 3.0) - t3v) * 6.0;
			else
				c[i] = t1;

			c[i] = Math.floor(c[i] * 255.0);
		}

		self.hue_rgb = c;
		
		if(p)
			p.css('background-color', 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')');

		if(h && hs)
		{
			var ofs = h.offset();
		
			hs.css('left', (ofs.left - p.offset().left));
			hs.css('top', Math.floor((self.state.hue * 100.0) - 2));
		}

		self.update_value();
	};

	this.clip = function(ev, e)
	{
		var o = e.offset();

		return ev.pageX < o.left || ev.pageX > o.left + e.width() || ev.pageY < o.top || ev.pageY > o.top + e.height();
	};
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
	};
	
	this.state_changed = function(ui)
	{
		if(ui)
		{
			var i = ui.find('#img'),
			    s = ui.find('#sel'),
			    h = ui.find('#hue'),
			    hs = ui.find('#hue-sel');
		
			self.update_hue(i, h, hs);
			self.update_picker(ui, s);
		}
		else
		{
			self.hue_rgb = [255.0, 0.0, 0.0];
			self.hue_drag = false;
			self.color_drag = false;
			self.hue_clipped = false;
			self.color_clipped = false;
			self.color = new Color(1.0, 1.0, 1.0, 1.0);
			self.update_hue(null, null, null);
		}
	};
};
