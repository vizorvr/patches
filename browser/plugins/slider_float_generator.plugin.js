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
			'<td><input class="min" type="number" step="0.2" style="width: 50px;"/></td>'+
			'<td><input class="slider" type="range" step="0.001"></td>'+
			'<td><input class="max" type="number" step="0.2" style="width: 50px;"/></td>'+
		'</tr>'+
		'<tr>'+
			'<td></td>'+
			'<td class="slider-value">0.0</td>'+
			'<td></td>'+
		'</tr>'+
		'</table>'

	var $el = $(html)

	var $min = this.$min = $el.find('input.min')
	var $max = this.$max = $el.find('input.max')
	var $slider = this.$slider = $el.find('input.slider')
	this.$display = $el.find('td.slider-value')

	$slider.on('input', function() {
		that.undoableSetState('val', parseFloat($slider.val()), that.state.val)
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
	this.$slider.prop('step', (this.state.max - this.state.min) / 1000)
	this.$slider.prop('max', this.state.max)
	this.$slider.prop('min', this.state.min)
}

Slider.prototype.update_output = function() {
	return this.state.val
}
})();


