(function() {
	var ThreeClickableObject = E2.plugins.three_clickable_object = function(core) {
		this.desc = 'Clickable object'
		Plugin.apply(this, arguments)

		this.input_slots = [
			{name: 'object3d', dt: core.datatypes.OBJECT3D},
		]

		this.output_slots = [
			{name: 'object3d', dt: core.datatypes.OBJECT3D},
			{name: 'clicked', dt: core.datatypes.BOOL}
		]
	}

	ThreeClickableObject.prototype.reset = function() {
		this.setClickedOnNextUpdate = false
		this.clicked = false
	}

	ThreeClickableObject.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		case 0: // object3d
			this.object3d = data
			break
		default:
			break
		}
	}

	ThreeClickableObject.prototype.update_output = function(slot) {
		switch(slot.index) {
		case 0:
			return this.object3d
		case 1:
			return this.clicked
		default:
			break
		}
	}

	ThreeClickableObject.prototype.on_click = function() {
		this.setClickedOnNextUpdate = true
	}

	ThreeClickableObject.prototype.update_state = function() {
		if (this.object3d) {
			this.object3d.onClick = this.on_click.bind(this)
		}

		this.clicked = this.setClickedOnNextUpdate
		this.setClickedOnNextUpdate = false
	}
})()