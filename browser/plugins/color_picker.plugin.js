(function() {
var ColorPicker = E2.plugins.color_picker = function(core) {
	Plugin.apply(this, arguments)
	this.desc = 'Provides an intuitive way of picking arbitrary colors via a hue slider and saturation / value selection area.';
	this.input_slots = [];
	
	this.output_slots = [
		{
			name: 'color',
			dt: core.datatypes.COLOR,
			desc: 'The selected color.',
			def: new THREE.Color(1,1,1)
		}
	];

	this._oldState = null;
	this.state = { hue: 0.0, sat: 0.0, lum: 1.0 };
	// note: .lum above is used as B/V so model is actually HSV
	// 		 http://codeitdown.com/hsl-hsb-hsv-color/

	this.ui = null;
	this.color = {};
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
		// dom elements
		'Hex' : null,
		'R' : null,
		'G' : null,
		'B' : null
	};

	function beginModifyState() {
		E2.app.undoManager.begin('Pick color')
		that._oldState = { hue: that.state.hue, sat: that.state.sat, lum: that.state.lum }
	}

	function endModifyState() {
		if (!that._oldState)
			return;

		if (that._oldState.hue !== that.state.hue)
			that.undoableSetState('hue',
				that.state.hue,
				that._oldState.hue
			)

		if (that._oldState.sat !== that.state.sat)
			that.undoableSetState('sat',
				that.state.sat,
				that._oldState.sat
			)

		if (that._oldState.lum !== that.state.lum)
			that.undoableSetState('lum',
				that.state.lum,
				that._oldState.lum
			)

		E2.app.undoManager.end()
		that._oldState = null	// otherwise we keep tracking the mouse
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
	s.attr('src', '/images/color_picker/select.gif');
	hs.attr('src', '/images/color_picker/hue-select_h.svg');
	i.attr('src', '/images/color_picker/picker.png');

	h.attr('preserveAspectRatio', 'xMidYMid none');
	// hue image
	h.css({
		'width': ''+ww+'px',
		'border': '0',
		'border-radius': '2px',
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
		'z-index': '101'
	});

	s.css({
		'width': '11px',
		'height': '11px',
		'z-index': '101',
		'position': 'absolute'
	});

	// big image (saturation + value)
	i.css({
		'width': ''+ww+'px',
		'height': ''+hh+'px',
		'border': '0',
		'border-radius': '2px',
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

	function afterMove() {
		that.update_picker(c, s);
		that.update_rgb_value();
		that.indicator.update(that.color);
	}

	function moveV(val) {
		that.state.lum = val;
		afterMove()
	}

	function moveS(sat) {
		that.state.sat = sat;
		afterMove()
	}

	var opts = {
		min : 0.0,
		max : 1.0,
		step : 0.001,
		getValue : function() { return that.state.sat },

		isSurface : true,
		cssCursor : 'crosshair',
		orientation : 'horizontal'
	}

	// one for the area
	NodeUI.makeUIAdjustableValue(i[0], beginModifyState, moveS, endModifyState, opts)
	opts.surfaceDomNode = i[0]
	NodeUI.makeUIAdjustableValue(s[0], beginModifyState, moveS, endModifyState, opts)
	delete(opts.surfaceDomNode)

	// one for the picker within the area
	opts.getValue = function() { return that.state.lum }
	opts.orientation = 'vertical'
	opts.min = 1.0
	opts.max = 0.0
	NodeUI.makeUIAdjustableValue(i[0], beginModifyState, moveV, endModifyState, opts)
	opts.surfaceDomNode = i[0]
	NodeUI.makeUIAdjustableValue(s[0], beginModifyState, moveV, endModifyState, opts)

	function moveH(hue) {
		that.state.hue = hue
		that.update_hue(i, h, hs);
		that.update_rgb_value();
		that.indicator.update(that.color);
	}

	opts = {
		min : 0.00001,
		max : 0.99999,
		step : 0.001,
		getValue : function() { return that.state.hue },
		isSurface: true,
		cssCursor: 'crosshair',
		orientation: 'horizontal'
	}
	// as sv
	NodeUI.makeUIAdjustableValue(h[0], beginModifyState, moveH, endModifyState, opts)
	opts.surfaceDomNode = h[0]
	NodeUI.makeUIAdjustableValue(hs[0], beginModifyState, moveH, endModifyState, opts)


	var t = this.create_ui_valuesIndicator(c);
	this.ui = jQuery('<div></div>').append(c,t);


	// RGB

	function makeStateFromThisColor() {
		// modify this.color (rgb), and convert from HSL to this.state (HSV)
		var hsl = that.color.getHSL();
		var _s, _v, _h, _l;		// clamp everything

		_h = hsl.h;
		_h = _h < 0.0 ? 0.0 : _h > 1.0 ? 1.0 : _h;

		_l = hsl.l;
		_l = _l < 0.0 ? 0.0 : _l > 1.0 ? 1.0 : _l;

		_v = 0.5 * (2 * _l + hsl.s * (1 - Math.abs(2 * _l - 1)))
		_v = _v <= 0.0 ? 0.000001 : _v > 1.0 ? 1.0 : _v;	// /0

		_s = (2 * (_v - _l)) /  _v ;
		_s = _s < 0.0 ? 0.0 : _s > 1.0 ? 1.0 : _s;

		that.state.hue = _h;
		that.state.sat = _s;
		that.state.lum = _v;	// !
	}

	var getComponent = function (which) {
		return function(){ return that.color[which] }
	}

	var setComponent = function(which) {
		return function(v) {

			that.color[which] = v;
			makeStateFromThisColor()
			that.state_changed(that.ui)
		}
	}


	var options = {
		min : 0.00001,
		max : 1,
		step : 0.002,
		cssCursor : 'ns-resize',

		allowTextInput : true,
		textInputParentNode : c[0],
		parseTextInput : function(value) {
			var v = parseFloat(value)
			if (isNaN(v)) return false
			if (!isFinite(v)) return false
			return v/255
		}
	}

	NodeUI.makeUIAdjustableValue(
		this.indicator.R[0],
		beginModifyState,
		setComponent('r'),
		endModifyState,
		_.extend(options, {getValue: getComponent('r')} )
	);

	NodeUI.makeUIAdjustableValue(
		this.indicator.G[0],
		beginModifyState,
		setComponent('g'),
		endModifyState,
		_.extend(options, {getValue: getComponent('g')} )
	);

	NodeUI.makeUIAdjustableValue(
		this.indicator.B[0],
		beginModifyState,
		setComponent('b'),
		endModifyState,
		_.extend(options, {getValue: getComponent('b')} )
	);

	this.indicator.Hex.on('dblclick', function(e){
		NodeUI.enterValueControl(that.indicator.Hex[0], c[0], function(hex){
			var pad = '000000'
			hex = hex.toString().replace('#','').toUpperCase()
			if (hex.length === 3) {
				var old = hex
				hex = old.substring(0,1) + old.substring(0,1) +
					  old.substring(1,2) + old.substring(1,2) +
					  old.substring(2,3) + old.substring(2,3)
			} else {
				hex = '' + hex + pad.substring(0, pad.length - hex.length)
				hex = hex.substring(0,6)
			}
			if (hex.length !== 6) return false
 			var isOk = /^[0-9A-F]{6}$/i.test(hex)
			if (!isOk) return false
	 		beginModifyState()
			that.color.setHex('0x'+hex)
			makeStateFromThisColor()
			that.state_changed(that.ui)
			endModifyState()
		})
	})

	return this.ui;
};

// converts the state (HSV) to HSL and sets the referenced color
ColorPicker.prototype.setFromState = function(/* @var THREE.Color */ color) {
	var _h, _s, _l;

	var _v = this.state.lum;	// !
	_v = _v < 0.0 ? 0.0 : _v > 1.0 ? 1.0 : _v;

	_h = this.state.hue;
	_h = _h < 0.0 ? 0.0 : _h > 1.0 ? 1.0 : _h;

	_l = 0.5 * _v * (2 - this.state.sat);
	_l = _l < 0.0 ? 0.0 : _l > 1.0 ? 1.0 : _l;
	var tl = _l;
	_l = _l <= 0.0 ? 0.000001 : _l >= 1.0 ? 0.999999 : _l;	// avoid division by zero below

	_s = _v * this.state.sat / (1 - Math.abs(2 * _l - 1));
	_s = _s < 0.0 ? 0.0 : _s > 1.0 ? 1.0 : _s;

	_l = tl;

	color.setHSL(_h, _s, _l);
	return color;
}

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

};

ColorPicker.prototype.update_output = function() {
	return this.color;
};

ColorPicker.prototype.update_rgb_value = function() {
	if (this.color) {
		this.setFromState(this.color);
		this.updated = true;
	}
};


ColorPicker.prototype.update_picker = function(c, s) {
	var left = Math.round(this.state.sat * this.picker_width) - 6;
	var top = Math.round((1.0 - this.state.lum) * this.picker_height) - 6;
	s.css('left', left);
	s.css('top', top );
};


ColorPicker.prototype.update_hue = function(i, h, hs) {
	var hue = this.state.hue;

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

		c[x] = Math.round(c[x] * 255.0);
	}

	if(i)
		i.css('background-color', 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')');

	if(h && hs) {
		// horizontal
		hs.css('left', Math.round(( (this.state.hue) * this.picker_width) - 2));
	}
};

ColorPicker.prototype.clip = function(ev, e) {
	var o = e.offset();
	return ev.pageX < o.left || ev.pageX > o.left + e.width() || ev.pageY < o.top || ev.pageY > o.top + e.height();
};

ColorPicker.prototype.state_changed = function(/* @var jQuery */ ui)
{
	if(ui) {
		this.update_rgb_value();
		this.update_hue(this.i, this.h, this.hs);
		this.update_picker(ui, this.s);
		this.indicator.update(this.color);
	} else {
		this.color = new THREE.Color(1,1,1);
		this.update_hue(null, null, null);
	}
};

})();
