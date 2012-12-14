E2.p = E2.plugins["color_picker"] = function(core, node)
{
	this.desc = 'Provides an intuitive way of picking arbitary colors via a hue slider and saturation / luminosity selection area.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The selected color.', def: 'White' }
	];
	
	this.state = { hue: 0.0, sat: 0.0, lum: 1.0 };
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	this.changed = true;
};

E2.p.prototype.create_ui = function()
{
	var c = this.c = make('div');
	var i = this.i = make('img');
	var s = this.s = make('img');
	var h = this.h = make('img');
	var hs = this.hs = make('img');

	c.css({
		'width': '130px',
		'height': '102px',
		'margin-right': '10px',
		'position': 'relative'
	});

	h.attr('src', 'images/color_picker/hue.png');
	h.attr('id', 'hue');
	s.attr('src', 'images/color_picker/select.gif');
	s.attr('id', 'sel');
	hs.attr('src', 'images/color_picker/hue-select.png');
	hs.attr('id', 'hue-sel');
	i.attr('src', 'images/color_picker/picker.png');
	i.attr('id', 'img');

	h.css({
		'width': '14px',
		'height': '100px',
		'border': '1px solid #888',
		'cursor': 'crosshair',
		'z-index': '100'
	});

	hs.css({
		'position': 'absolute',
		'top': '0px',
		'left': '114px',
		'width': '20px',
		'height': '5px',
		'cursor': 'crosshair',
		'z-index': '101'
	});

	s.css({
		'width': '11px',
		'height': '11px',
		'cursor': 'crosshair',
		'z-index': '101',
		'position': 'absolute'
	});

	i.css({
		'width': '100px',
		'height': '100px',
		'border': '1px solid #888',
		'cursor': 'crosshair',
		'z-index': '100',
		'background-color': '#f00'
	});

	c.append(i);
	c.append(s);
	c.append(h);
	c.append(hs);

	var c_down = function(self, c, i, s) { return function(e) 
	{ 
		self.color_drag = true;
		self.update_picker_ev(e, c, s, i);
	}}(this, c, i, s);

	var c_up = function(self) { return function(e)
	{ 
		e.preventDefault(); 
		self.color_drag = false;
	}}(this);

	var c_move = function(self, c, i, s) { return function(e)
	{
		self.update_picker_ev(e, c, s, i);
		self.color_clipped = self.clip(e, i);
	}}(this, c, i, s);

	s.mousedown(c_down);
	s.mouseup(c_up);
	s.mousemove(c_move);

	i.mousedown(c_down);
	i.mouseup(c_up);
	i.mousemove(c_move);

	var h_down = function(self, i, h, hs) { return function(e) 
	{ 
		e.preventDefault(); 
		self.hue_drag = true;
		self.update_hue_ev(e, i, h, hs);
	}}(this, i, h, hs);

	var h_up = function(self) { return function(e)
	{
		e.preventDefault();
		self.hue_drag = false;
	}}(this);

	var h_move = function(self, i, h, hs) { return function(e)
	{
		self.update_hue_ev(e, i, h, hs);
		self.hue_clipped = self.clip(e, h);
	}}(this, i, h, hs);

	hs.mousedown(h_down);
	hs.mouseup(h_up);
	hs.mousemove(h_move);

	h.mousedown(h_down);
	h.mouseup(h_up);
	h.mousemove(h_move);

	return c;
};

E2.p.prototype.update_output = function(slot)
{
	return this.color;
};

E2.p.prototype.update_value = function(c)
{
	var sat = this.state.sat;
	var lum = this.state.lum;
	var nc = [this.hue_rgb[0] / 255.0, this.hue_rgb[1] / 255.0, this.hue_rgb[2] / 255.0];
	var lc = lum * (1.0 - sat);
	var cnv = function(cmp) { return lc + (nc[cmp] * lum * sat); };
	var cnv2 = function(cmp) { return Math.floor(nc[cmp] * 255.0); };

	nc = [cnv(0), cnv(1), cnv(2)];
	var rgb = this.color ? this.color.rgba : null;
	
	if(!rgb || rgb[0] !== nc[0] || rgb[1] !== nc[1] || rgb[2] !== nc[2])
	{
		rgb[0] = nc[0];
		rgb[1] = nc[1];
		rgb[2] = nc[2];
		this.changed = true;
	}
	
	if(c)
		c.css('background-color', 'rgb(' + cnv2(0) + ', ' + cnv2(1) + ', ' + cnv2(2) + ')');
};

E2.p.prototype.update_picker_ev = function(e, c, s, i)
{
	e.preventDefault();

	if(!this.color_drag || this.color_clipped)
		return;

	var i_o = i.offset();
	var st = this.state;
	
	st.sat = (e.pageX - i_o.left) / 100.0;
	st.lum = 1.0 - ((e.pageY - i_o.top) / 100.0);
	
	st.sat = st.sat < 0.0 ? 0.0 : st.sat > 1.0 ? 1.0 : st.sat;
	st.lum = st.lum < 0.0 ? 0.0 : st.lum > 1.0 ? 1.0 : st.lum;

	this.update_picker(c, s);
};

E2.p.prototype.update_picker = function(c, s)
{
	s.css('left', Math.floor((this.state.sat * 100.0)) - 5);
	s.css('top', Math.floor((1.0 - this.state.lum) * 100.0) - 5);

	this.update_value(c);
};

E2.p.prototype.update_hue_ev = function(e, i, h, hs)
{
	e.preventDefault();

	if(!this.hue_drag || this.hue_clipped)
		return;

	this.state.hue = (e.pageY - h.offset().top) / 100.0;
	this.update_hue(i, h, hs);
};

E2.p.prototype.update_hue = function(i, h, hs)
{
	var hue = 1.0 - this.state.hue;

	var t2 = 1.0;
	var t1 = 0.0;		
	var t3 = [hue + 1.0 / 3.0, hue, hue - 1.0 / 3.0];
	var c = [0, 0, 0];

	for(var x = 0; x < 3; x++)
	{
		if(t3[x] < 0.0)
			t3[x] += 1.0;
		else if(t3[x] > 1.0)
			t3[x] -= 1.0;

		var t3v = t3[x];
			
		if(6.0 * t3v < 1.0)
			c[x] = t3v * 6.0;
		else if(2.0 * t3v < 1.0)
			c[x] = 1.0;
		else if(3.0 * t3v < 2.0)
			c[x] = ((2.0 / 3.0) - t3v) * 6.0;
		else
			c[x] = t1;

		c[x] = Math.floor(c[x] * 255.0);
	}

	this.hue_rgb = c;
	
	if(i)
		i.css('background-color', 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')');

	if(h && hs)
	{
		var ofs = h.offset();
	
		hs.css('left', (ofs.left - i.offset().left));
		hs.css('top', Math.floor((this.state.hue * 100.0) - 2));
	}

	this.update_value();
};

E2.p.prototype.clip = function(ev, e)
{
	var o = e.offset();

	return ev.pageX < o.left || ev.pageX > o.left + e.width() || ev.pageY < o.top || ev.pageY > o.top + e.height();
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.changed)
	{
		this.changed = false;
		this.updated = true;
	}
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.update_hue(ui.find('#img'), ui.find('#hue'), ui.find('#hue-sel'));
		this.update_picker(ui, ui.find('#sel'));
	}
	else
	{
		this.hue_rgb = [255.0, 0.0, 0.0];
		this.hue_drag = false;
		this.color_drag = false;
		this.hue_clipped = false;
		this.color_clipped = false;
		this.color = new Color(1.0, 1.0, 1.0, 1.0);
		this.update_hue(null, null, null);
	}
};
