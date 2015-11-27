(function() {

var Touching = E2.plugins.touching_generator = function(core) {
	this.desc = 'While touching eg. a mobile device, this outputs a boolean true.'
	
	this.input_slots = []
	
	this.output_slots = [{
		name: 'trigger',
		dt: core.datatypes.BOOL,
		desc: 'True while the touch is ongoing.',
		def: false
	}]

	this.touching = false

	this.startListener = function startListener() {
		this.touching = true
		this.updated = true
	}.bind(this)

	this.endListener = function endListener() {
		this.touching = false
		this.updated = true
	}.bind(this)
}

Touching.prototype.update_output = function() {
	return this.touching
}

Touching.prototype.destroy = function() {
	E2.dom.webgl_canvas.off('touchstart', this.startListener)
	E2.dom.webgl_canvas.off('touchend', this.endListener)
}

Touching.prototype.state_changed = function(ui) {
	if (!ui) {
		E2.dom.webgl_canvas.on('touchstart', this.startListener)
		E2.dom.webgl_canvas.on('touchend', this.endListener)
	}
}

})()
