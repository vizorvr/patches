(function() {

var MouseButtons = E2.plugins.mouse_button_generator = function(core) {
	this.desc = 'Emits the current mouse button state.'
	
	this.input_slots = []
	
	this.output_slots = [ 
		{ name: 'Left', dt: core.datatypes.BOOL, desc: 'True if the left mouse button is pressed and false otherwise.', def: false },
		{ name: 'Middle', dt: core.datatypes.BOOL, desc: 'True if the middle mouse button is pressed and false otherwise.', def: false },
		{ name: 'Right', dt: core.datatypes.BOOL, desc: 'True if the right mouse button is pressed and false otherwise.', def: false }
	]
}

MouseButtons.prototype.update_output = function(slot) {
	return this.buttons[slot.index]
}

MouseButtons.prototype.mouse_down = function(e) {
	e.preventDefault()
	this.buttons[e.which - 1] = true
	this.updated = true
}

MouseButtons.prototype.mouse_up = function(e) {
	this.buttons[e.which - 1] = false
	this.updated = true
}

MouseButtons.prototype.state_changed = function(ui) {
	if (!ui) {
		this.buttons = []
		this.buttons[0] = this.buttons[1] = this.buttons[2] = false

		E2.dom.webgl_canvas.on('mousedown', this.mouse_down.bind(this))
		E2.dom.webgl_canvas.on('mouseup', this.mouse_up.bind(this))
	}
}

})()
