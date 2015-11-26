(function() {

var TouchEnd = E2.plugins.touch_end_generator = function(core, node) {
	this.desc = 'When a touch on eg. a mobile device ends, this outputs a boolean true value for one frame.'
	
	this.input_slots = []
	
	this.output_slots = [{
		name: 'trigger',
		dt: core.datatypes.BOOL,
		desc: 'True when the touch ends.',
		def: false
	}]

	this.triggered = false
	this.frames = 0

	this.endListener = function endListener() {
		this.frames = 0
		this.triggered = true
		this.updated = true
		node.queued_update = 1
	}.bind(this)
}

TouchEnd.prototype.update_output = function() {
	return this.triggered
}

TouchEnd.prototype.update_state = function() {
	if (this.frames++ > 0)
		this.triggered = false
}

TouchEnd.prototype.destroy = function() {
	E2.dom.webgl_canvas.off('touchend', this.endListener)
}

TouchEnd.prototype.state_changed = function(ui) {
	if (!ui) {
		E2.dom.webgl_canvas.on('touchend', this.endListener)
	}
}

})()
