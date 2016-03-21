(function() {
var knobImgWidth = 44
var knobImgHalfWidth = 22
var knobCssTransform = 'translate(-'+ knobImgHalfWidth +'px,-'+knobImgHalfWidth+'px) scale(0.5) rotate('
var knobRotationMin = 30.0;
var knobRotationRange = 300.0;

var Knob = E2.plugins.knob_float_generator = function(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Emits a user controllable float value between 0 and 1.'
	
	this.input_slots = []
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the knob is adjusted.', lo: 0, hi: 1, def: 0 }
	]

	this.state = { val: 0.0 }
	this.knob = null
}

Knob.prototype = Object.create(Plugin.prototype)

Knob.prototype.reset = function() {}

Knob.prototype.setRotation = function() {
	var rotation = knobRotationMin + Math.floor(this.state.val * knobRotationRange);
	var transform = knobCssTransform + rotation + 'deg)'
	
	this.knob.css({
		'-webkit-transform': transform,
		'-moz-transform': transform,
		'transform':  transform
	})
}

Knob.prototype.create_ui = function() {
	var that = this
	var $container = make('div');

	this.readout = make('span')
	this.knob = make('div')

	// sized at 2x and scaled down for smoother svg display
	this.knob
		.css({
			'width': (2 * knobImgWidth) + 'px',
			'height': (2 * knobImgWidth) + 'px'
		})

	this.readout
		.css({
			'height': ( knobImgWidth-2) + 'px',
			'width': ( knobImgWidth-2) + 'px',
			'line-height': (knobImgWidth) + 'px'
		})

	$container.append(this.knob, this.readout)

	var oldValue = that.state.val
	var onEnd = function() {
		that.undoableSetState('val', that.state.val, oldValue)
	}
	var onChange = function(v) {
		that.state.val = v
		that.update_ui()
		that.updated = true
	}
	var onStart = function() {
		oldValue = that.state.val
	}

	this.ui = this.knob

	var opts = {
		cssCursor: 'ns-resize',
		getValue : function() {return that.state.val},
		min : 0.0,
		max : 1.0,
		step : 0.01
	}
	uiMakeDragToAdjust(this.knob[0]	, onStart, onChange, onEnd, opts)
	uiMakeDragToAdjust(this.readout[0], onStart, onChange, onEnd, opts)

	this.node.on('pluginStateChanged', this.update_ui.bind(this))
	this.update_ui();

	return $container
}

Knob.prototype.update_output = function() {
	return this.state.val
}

Knob.prototype.updateReadout = function() {
	this.readout.text(this.state.val.toFixed(2))
}

Knob.prototype.update_ui = function() {
	if (this.ui) {
		this.setRotation()
		this.updateReadout()
	}
}

})()