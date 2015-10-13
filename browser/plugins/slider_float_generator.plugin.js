(function(){
var Slider = E2.plugins.slider_float_generator = function(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Emits a user controllable float value between two specified values.'
	
	this.input_slots = []
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits the current value when the slider is adjusted.', def: 0 }
	]
	
	this.state = { val: 0.0, min: 0.0, max: 1.0 }
	
	this.node = node
	this.v_col = null
	this.slider = null
	this.handle = null
	this.pos = 0

	this.node.on('pluginStateChanged', this.updateUi.bind(this))
}

Slider.prototype = Object.create(Plugin.prototype)

Slider.prototype.reset = function() {}

Slider.prototype.create_ui = function() {
	var that = this

	var html = '<table class="slider-table">'+
		'<tr>'+
			'<td colspan="3"><input class="slider" type="range" step="0.001" style="width:190px;"></td>'+
		'</tr>'+
		'<tr>'+
			'<td style="width: 50px;"><input class="min" type="number" step="0.2" style="width: 50px;"/></td>'+
			'<td class="slider-value" style="text-align:center;">0.0</td>'+
			'<td style="width: 50px;"><input class="max" type="number" step="0.2" style="width: 50px;"/></td>'+
		'</tr>'+
		'</table>'

	var $el = $(html)

	var $min = this.$min = $el.find('input.min')
	var $max = this.$max = $el.find('input.max')
	var $slider = this.$slider = $el.find('input.slider')
	this.$display = $el.find('td.slider-value')

	var originalValue = this.state.val

	$slider.on('input', function() {
		that.$display.html($slider.val())
		that.realtimeSetState('val', parseFloat($slider.val()))
		return true;
	})

	$slider.on('mousedown', function() {
		originalValue = that.state.val
	})

	$slider.on('mouseup', function() {
		var sliderValue = parseFloat($slider.val())
		if (originalValue !== sliderValue)
			that.undoableSetState('val', sliderValue, originalValue)
	})

	$min.on('change', function() {
		that.undoableSetState('min', parseFloat($min.val()), that.state.min)
	})

	$max.on('change', function() {
		that.undoableSetState('max', parseFloat($max.val()), that.state.max)
	})

	this.updateUi()

	return $el
}

Slider.prototype.updateUi = function() {
	if (!this.$slider)
		return;
	this.$slider.val(this.state.val)
	this.$display.html(this.state.val)
	this.$min.val(this.state.min)
	this.$max.val(this.state.max)

	if (this.state.max < this.state.min) {
		var m = this.state.max
		this.state.max = this.state.min
		this.state.min = m
		this.$max.val(this.state.max)
		this.$min.val(this.state.min)
	}

	this.$slider.prop('step', (this.state.max - this.state.min) / 1000)
	this.$slider.prop('max', this.state.max)
	this.$slider.prop('min', this.state.min)
}

Slider.prototype.update_output = function() {
	return this.state.val
}
})();


