(function() {

var TouchStart = E2.plugins.touch_start_generator = function(core, node) {
	this.desc = 'When a touch on eg. a mobile device starts, this outputs a boolean true value for one frame.'
	
	this.input_slots = []
	
	this.output_slots = [{
		name: 'trigger',
		dt: core.datatypes.BOOL,
		desc: 'True when the touch starts.',
		def: false
	}]

	this.triggered = false
	this.frames = 0

	this.startListener = function startListener() {
		this.frames = 0
		this.triggered = true
		this.updated = true
		node.queued_update = 1
	}.bind(this)
}

TouchStart.prototype.update_output = function() {
	return this.triggered
}

TouchStart.prototype.update_state = function() {
	if (this.frames++ > 0)
		this.triggered = false
}

TouchStart.prototype.destroy = function() {
	E2.dom.webgl_canvas.off('touchstart', this.startListener)
}

TouchStart.prototype.state_changed = function(ui) {
	if (!ui) {
		E2.dom.webgl_canvas.on('touchstart', this.startListener)
	}
}

})()
