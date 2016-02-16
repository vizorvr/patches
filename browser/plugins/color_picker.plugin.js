(function() {

var clamp = THREE.Math.clamp

var ColorPicker = function(core) {

	Plugin.apply(this, arguments)
	this.desc = 'Provides an intuitive way of picking arbitrary colors via a hue slider and saturation/value selection area.';
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
	// note: .lum above is used as B/V so model is actually HSV
	// note: .hue above is inverted (1.0 - hue) and therefore goes clockwise - #990
	// 		 http://codeitdown.com/hsl-hsb-hsv-color/

	this.ui = null;
	this.color = new THREE.Color(1,1,1);
	this.updated = false;	// update_state
};

ColorPicker.prototype = Object.create(Plugin.prototype)

// sets the referenced color from the current state
ColorPicker.prototype.setFromState = function(/* @var THREE.Color */ color) {
	var hue, sat, lum, val;

	// this.state has HSV, THREE.Color needs HSL
	val = clamp(this.state.lum, 0.0, 1.0)

	// hue is inverted (#990)
	hue = clamp(1.0 - this.state.hue, 0.0, 1.0)

	lum = 0.5 * val * (2 - this.state.sat);
	lum = clamp(lum, 0.0, 1.0)

	var tl = clamp(lum, 0.00001, 0.999999)	// avoid division by zero below

	sat = val * this.state.sat / (1 - Math.abs(2 * tl - 1));
	sat = clamp(sat, 0.0, 1.0)

	color.setHSL(hue, sat, lum);
	return color;
}

ColorPicker.prototype.makeStateFromThisColor = function() {
	// modify this.color (rgb), and convert from HSL to this.state (HSV)
	var hsl = this.color.getHSL();
	var sat, val, hue, lum;		// clamp everything

	hue = clamp(hsl.h, 0.0, 1.0)
	lum = clamp(hsl.l, 0.0, 1.0)

	val = 0.5 * (2 * lum + hsl.s * (1 - Math.abs(2 * lum - 1)))
	val = clamp(val, 0.0, 1.0)
	var tempVal = (val === 0.0) ? 0.000001 : val;	// avoid division by zero

	sat = 2 * (val - lum) /  tempVal ;
	sat = clamp(sat, 0.0, 1.0)

	this.state.sat = sat;
	this.state.lum = val;	// !
	if (sat > 0.0)
		this.state.hue = 1.0 - hue;		// note hue is inverted
}

ColorPicker.prototype.create_ui = function() {
	var $container = this.c = make('div');
	var $svSurface = this.i = make('img');
	var $svPicker = this.s = make('img');
	var $hueSurface = this.h = make('img');
	var $huePicker = this.hs = make('img');

	this.indicator = {
		// dom elements
		'Hex' : null,
		'R' : null,
		'G' : null,
		'B' : null
	};

	var ww = 178;	// container width
	var hh = 120;
	var ch = hh + 24;	// container height = picker + hue
	this.picker_height = 0.0 + hh;
	this.picker_width = 0.0 + ww;
	$container.css({
		'height': '' + ch + 'px',
		'width': '' + ww + 'px',
		'position': 'relative'
	});

	$hueSurface.attr('src', '/images/color_picker/hue_h.svg');
	$huePicker.attr('src', '/images/color_picker/hue-select_h.svg');
	$svSurface.attr('src', '/images/color_picker/picker.png');
	$svPicker.attr('src', '/images/color_picker/select.gif');

	$hueSurface.attr('preserveAspectRatio', 'xMidYMid none');
	// hue image
	$hueSurface.css({
		'width': ''+ww+'px',
		'border': '0',
		'border-radius': '2px',
		'z-index': '100',
		'position': 'absolute',
		'top' : ''+(hh+4)+'px',
		'left': '0'
	});

	$huePicker.css({
		'position': 'absolute',
		'left': '0px',
		'top': ''+(hh+3)+'px',
		'height': '20px',
		'width': '5px',
		'z-index': '101'
	});

	$svPicker.css({
		'width': '11px',
		'height': '11px',
		'z-index': '101',
		'position': 'absolute'
	});

	// big image (saturation + value)
	$svSurface.css({
		'width': ''+ww+'px',
		'height': ''+hh+'px',
		'border': '0',
		'border-radius': '2px',
		'z-index': '100'
	});
	$svSurface.attr({
		'width': ww,
		'height': hh
	});

	$container.append($svSurface);
	$container.append($svPicker);
	$container.append($hueSurface);
	$container.append($huePicker);

	var t = this.ui_createValuesIndicator($container);
	this.ui = jQuery('<div></div>').append($container,t);

	this.ui_enableInteraction($container[0], $svSurface[0], $svPicker[0], $hueSurface[0], $huePicker[0])

	return this.ui;
};

ColorPicker.prototype.updateRGBValue = function() {
	this.setFromState(this.color);
	this.updated = true;
};

ColorPicker.prototype.updatePicker = function(c, s) {
	var left = Math.round(this.state.sat * this.picker_width) - 6;
	var top = Math.round((1.0 - this.state.lum) * this.picker_height) - 6;
	s.css('left', left);
	s.css('top', top );
};

ColorPicker.prototype.updateHue = function(i, h, hs) {
	var cc = new THREE.Color()
	var hue = 1.0 - this.state.hue;
	cc.setHSL(hue, 1.0, 0.5);	// peg to max brightness

	if(i)
		i.css('background-color', '#' + cc.getHexString())

	if(h && hs) {
		// horizontal
		hs.css('left', Math.round(( (hue) * this.picker_width) - 2));
	}
};

// creates the HexRGB widget
ColorPicker.prototype.ui_createValuesIndicator = function(/* @var jQuery */ c) {
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
		if (this._oldcolor.equals(c)) return;	// nothing to update
		this._oldcolor = c.clone();
		this.Hex.html(c.getHexString());
		this.R.html(Math.round(255 * c.r));
		this.G.html(Math.round(255 * c.g));
		this.B.html(Math.round(255 * c.b));
		// three.color has no alpha
	}.bind(i);
	return $t;
}

ColorPicker.prototype.ui_enableInteraction = function(containerNode, svSurfaceNode, svPickerNode, hueSurfaceNode, huePickerNode) {
	var that = this

	function beginModifyState() {
		that.beginBatchModifyState()
	}

	function endModifyState () {
		return that.endBatchModifyState('Pick color')
	}

	function moveValue(val) {
		that.state.lum = val;
		that.state_changed(that.ui)
	}

	function moveSaturation(sat) {
		that.state.sat = sat;
		that.state_changed(that.ui)
	}

	function moveHue(hue) {
		that.state.hue = 1.0 - hue	// #990
		that.state_changed(that.ui)
	}

	// sat/val
	var opts = {
		min : 0.0,
		max : 1.0,
		step : 0.001,
		getValue : function() { return that.state.sat },
		isSurface : true,
		cssCursor : 'crosshair',
		orientation : 'horizontal'
	}

	// two for the area (x/y) and two for the picker within the area (x/y)
	NodeUI.makeUIAdjustableValue(svSurfaceNode, beginModifyState, moveSaturation, endModifyState, opts)
	opts.surfaceDomNode = svSurfaceNode
	NodeUI.makeUIAdjustableValue(svPickerNode, beginModifyState, moveSaturation, endModifyState, opts)
	delete opts.surfaceDomNode

	opts.getValue = function() { return that.state.lum }
	opts.orientation = 'vertical'
	opts.min = 1.0
	opts.max = 0.0
	NodeUI.makeUIAdjustableValue(svSurfaceNode, beginModifyState, moveValue, endModifyState, opts)
	opts.surfaceDomNode = svSurfaceNode
	NodeUI.makeUIAdjustableValue(svPickerNode, beginModifyState, moveValue, endModifyState, opts)

	// hue
	opts = {
		min : 0.00001,
		max : 0.99999,
		step : 0.001,
		getValue : function() { return that.state.hue },
		isSurface: true,
		cssCursor: 'crosshair',
		orientation: 'horizontal'
	}
	// one for surface, one for indicator
	NodeUI.makeUIAdjustableValue(hueSurfaceNode, beginModifyState, moveHue, endModifyState, opts)
	opts.surfaceDomNode = hueSurfaceNode
	NodeUI.makeUIAdjustableValue(huePickerNode, beginModifyState, moveHue, endModifyState, opts)

	// indicator rgb
	var getComponent = function (which) {
		return function(){ return that.color[which] }
	}

	var setComponent = function(which) {
		return function(v) {
			that.color[which] = v;
			that.makeStateFromThisColor()
			that.state_changed(that.ui)
		}
	}

	var options = {
		min : 0.00001,
		max : 1,
		step : 0.002,
		cssCursor : 'ns-resize',

		allowTextInput : true,
		textInputParentNode : containerNode,
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

	// indicator hex
	this.indicator.Hex.on('dblclick', function(e){
		NodeUI.enterValueControl(that.indicator.Hex[0], containerNode, function(hex) {	// child, parent, handler
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
			that.makeStateFromThisColor()
			that.state_changed(that.ui)
			endModifyState()
		})
	})
}

// === common methods ===

ColorPicker.prototype.reset = function() {};

ColorPicker.prototype.update_state = function() {
}

ColorPicker.prototype.update_output = function() {
	return this.color;
};

ColorPicker.prototype.state_changed = function(/* @var jQuery */ ui) {
	this.updateRGBValue();
	if(ui) {
		this.updateHue(this.i, this.h, this.hs);
		this.updatePicker(ui, this.s);
		this.indicator.update(this.color);
	}
};

E2.plugins.color_picker = ColorPicker

})();