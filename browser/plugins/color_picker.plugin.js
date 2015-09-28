(function() {
var ColorPicker = E2.plugins.color_picker = function(core) {
	Plugin.apply(this, arguments)
	this.desc = 'Provides an intuitive way of picking arbitary colors via a hue slider and saturation / luminosity selection area.';
	this.input_slots = [];
	
	this.output_slots = [
		{
			name: 'color',
			dt: core.datatypes.COLOR,
			desc: 'The selected color.',
			def: new THREE.Color(1,1,1)
		}
	];
	
	this.state = { hue: 0.0, sat: 0.0, lum: 1.0 };
};

ColorPicker.prototype = Object.create(Plugin.prototype)

ColorPicker.prototype.reset = function()
{
};

ColorPicker.prototype.create_ui = function()
{
	var c = this.c = make('div');
	var i = this.i = make('img');
	var s = this.s = make('img');
	var h = this.h = make('img');
	var hs = this.hs = make('img');
	var that = this

	this.indicator = {
		'Hex' : null,
		'R' : null,
		'G' : null,
		'B' : null
	};

	function onMouseDown() {
		E2.app.undoManager.begin('Pick color')
		that._mouseDownValue = { hue: that.state.hue, sat: that.state.sat, lum: that.state.lum }
	}

	function onMouseUp() {
		if (!that._mouseDownValue)
			return;

		if (that._mouseDownValue.hue !== that.state.hue)
			that.undoableSetState('hue',
				that.state.hue,
				that._mouseDownValue.hue
			)

		if (that._mouseDownValue.sat !== that.state.sat)
			that.undoableSetState('sat',
				that.state.sat,
				that._mouseDownValue.sat
			)

		if (that._mouseDownValue.lum !== that.state.lum)
			that.undoableSetState('lum',
				that.state.lum,
				that._mouseDownValue.lum
			)

		E2.app.undoManager.end()
		that._mouseDownValue = null;	// otherwise we keep tracking the mouse
	}



	var ww = 178;	// container width
	var hh = 120;
	var ch = hh + 24;	// container height = picker + hue
	this.picker_height = 0.0 + hh;
	this.picker_width = 0.0 + ww;
	c.css({
		'height': '' + ch + 'px',
		'width': '' + ww + 'px',
		'position': 'relative'
	});

	h.attr('src', '/images/color_picker/hue_h.svg');
	h.attr('id', 'hue');
	s.attr('src', '/images/color_picker/select.gif');
	s.attr('id', 'sel');
	hs.attr('src', '/images/color_picker/hue-select_h.svg');
	hs.attr('id', 'hue-sel');
	i.attr('src', '/images/color_picker/picker.png');
	i.attr('id', 'img');

	h.attr('preserveAspectRatio', 'xMidYMid none');
	// hue image
	h.css({
		'width': ''+ww+'px',
		'border': '0',
		'border-radius': '2px',
		'cursor': 'crosshair',
		'z-index': '100',
		'position': 'absolute',
		'top' : ''+(hh+4)+'px',
		'left': '0'
	});

	hs.css({
		'position': 'absolute',
		'left': '0px',
		'top': ''+(hh+3)+'px',
		'height': '20px',
		'width': '5px',
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

	// big image
	i.css({
		'width': ''+ww+'px',
		'height': ''+hh+'px',
		'border': '0',
		'border-radius': '2px',
		'cursor': 'crosshair',
		'z-index': '100'
	});
	i.attr({
		'width': ww,
		'height': hh
	});

	c.append(i);
	c.append(s);
	c.append(h);
	c.append(hs);


	var c_down = function(self, c, i, s) { return function(e) 
	{ 
		onMouseDown()
		self.color_drag = true;
		self.update_picker_ev(e, c, s, i);
	}}(this, c, i, s);

	var c_up = function(self) { return function(e)
	{ 
		e.preventDefault(); 
		self.color_drag = false;
		onMouseUp()
	}}(this);

	var c_move = function(self, c, i, s) { return function(e)
	{
		if (!self._mouseDownValue) return true;	// nothing to do

		self.update_picker_ev(e, c, s, i);
		self.color_clipped = self.clip(e, i);
		self.indicator.update(self.color);

	}}(this, c, i, s);

	s.mousedown(c_down);
	s.mouseup(c_up);
	s.mousemove(c_move);

	i.mousedown(c_down);
	i.mouseup(c_up);
	i.mousemove(c_move);

	var h_down = function(self, ui, i, h, hs) { return function(e) 
	{ 
		onMouseDown()
		e.preventDefault(); 
		self.hue_drag = true;
		self.update_hue_ev(ui, e, i, h, hs);
	}}(this, c, i, h, hs);

	var h_up = function(self) { return function(e)
	{
		e.preventDefault();
		self.hue_drag = false;
		onMouseUp()
	}}(this);

	var h_move = function(self, ui, i, h, hs) { return function(e)
	{
		if (!self._mouseDownValue) return true;	// nothing to do
		self.update_hue_ev(ui, e, i, h, hs);
		self.hue_clipped = self.clip(e, h);
		self.indicator.update(self.color);
	}}(this, c, i, h, hs);

	hs.mousedown(h_down);
	hs.mouseup(h_up);
	hs.mousemove(h_move);

	h.mousedown(h_down);
	h.mouseup(h_up);
	h.mousemove(h_move);

	var t = this.create_ui_valuesIndicator(c);
	return jQuery('<div></div>').append(c,t);
};

ColorPicker.prototype.create_ui_valuesIndicator = function(/* @var jQuery */ c) {
	var $t = jQuery('<table></table>');
	var $row1 = jQuery('<tr></tr>');
	var row2 = [];
	var i = this.indicator;
	Object.keys(i).forEach(function(key){
		i[key] = jQuery('<td>-</td>');
		$row1.append(i[key]);
		row2.push('<th>'+key+'</th>');
	});
	var $row2 = jQuery('<tr>'+ row2.join('') + '</tr>');
	$t.append($row1, $row2);
	i._oldcolor = new THREE.Color(0,0,0);
	i.update = function(c){
		if (this._oldcolor.equals(c)) return true;	// nothing to update
		this._oldcolor = c.clone();
		this.Hex.html(c.getHexString());
		this.R.html(Math.round(255 * c.r));
		this.G.html(Math.round(255 * c.g));
		this.B.html(Math.round(255 * c.b));
		// this.A.html(Math.round(255 * c.a));	// three.color has no alpha
	}.bind(i);
	return $t;
}

ColorPicker.prototype.update_state = function() {
	this.update_value(this.c);
};

ColorPicker.prototype.update_output = function() {
	return this.color;
};

ColorPicker.prototype.update_value = function() {
	var sat = this.state.sat;
	var lum = this.state.lum;
	var nc = [this.hue_rgb[0] / 255.0, this.hue_rgb[1] / 255.0, this.hue_rgb[2] / 255.0];
	var lc = lum * (1.0 - sat);
	var cnv = function(cmp) { return lc + (nc[cmp] * lum * sat); };
	var cnv2 = function(cmp) { return Math.floor(nc[cmp] * 255.0); };

	nc = [cnv(0), cnv(1), cnv(2)];
	var rgb = this.color ? this.color : null;
	
	if(!rgb || rgb.r !== nc[0] || rgb.g !== nc[1] || rgb.b !== nc[2]) {
		rgb.setRGB(nc[0], nc[1], nc[2])
		this.updated = true;
	}

};

ColorPicker.prototype.get_as_rgb_string = function() {
	if (!this.color) return false;
	var c = this.color;
	var ret = 'rgb(' + [255*c.r, 255*c.g, 255*c.b].join(',') + ')';
	return ret;
};

ColorPicker.prototype.update_picker_ev = function(e, c, s, i) {
	e.preventDefault();

	if(!this.color_drag || this.color_clipped)
		return;

	var i_o = i.offset();
	var st = this.state;
	
	st.sat = (e.pageX - i_o.left) / this.picker_width;
	st.lum = 1.0 - ((e.pageY - i_o.top) / this.picker_height);

	st.sat = st.sat < 0.0 ? 0.0 : st.sat > 1.0 ? 1.0 : st.sat;
	st.lum = st.lum < 0.0 ? 0.0 : st.lum > 1.0 ? 1.0 : st.lum;
	
	this.update_picker(c, s);
};

ColorPicker.prototype.update_picker = function(c, s)
{
	s.css('left', Math.floor((this.state.sat * this.picker_width)) - 6);
	s.css('top', Math.floor((1.0 - this.state.lum) * this.picker_height) - 6);

	this.update_value();
};

ColorPicker.prototype.update_hue_ev = function(ui, e, i, h, hs)
{
	e.preventDefault();

	if(!this.hue_drag || this.hue_clipped)
		return;

//	this.state.hue = (e.pageY - h.offset().top) / this.picker_height	// vertical
	this.state.hue = 1.0 - (e.pageX - h.offset().left) / this.picker_width;
	this.update_hue(ui, i, h, hs);
};

ColorPicker.prototype.update_hue = function(ui, i, h, hs)
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

		// vertical
		// hs.css('left', (ofs.left - i.offset().left));
		// hs.css('top', Math.floor((this.state.hue * this.picker_height) - 2));

		// horizontal
		hs.css('left', Math.floor(( (1.0-this.state.hue) * this.picker_width) - 2));
	}

	this.update_value();
};

ColorPicker.prototype.clip = function(ev, e)
{
	var o = e.offset();

	return ev.pageX < o.left || ev.pageX > o.left + e.width() || ev.pageY < o.top || ev.pageY > o.top + e.height();
};

ColorPicker.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.update_hue(ui, ui.find('#img'), ui.find('#hue'), ui.find('#hue-sel'));
		this.update_picker(ui, ui.find('#sel'));
		if (typeof this.indicator.update != 'undefined') this.indicator.update(this.color);
	}
	else
	{
		this.hue_rgb = [255.0, 0.0, 0.0];
		this.hue_drag = false;
		this.color_drag = false;
		this.hue_clipped = false;
		this.color_clipped = false;
		this.color = new THREE.Color(1,1,1);
		this.update_hue(null, null, null, null);
	}
};

})();
