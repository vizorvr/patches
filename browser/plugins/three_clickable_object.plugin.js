(function() {
	var ThreeClickableObject = E2.plugins.three_clickable_object = function(core) {
		this.desc = 'Clickable object'
		Plugin.apply(this, arguments)

		this.input_slots = [
			{name: 'object3d', dt: core.datatypes.OBJECT3D},
			{name: 'text', dt: core.datatypes.TEXT}
		]

		this.output_slots = [
			{name: 'object3d', dt: core.datatypes.OBJECT3D}
		]
	}

	ThreeClickableObject.prototype.reset = function() {

	}

	ThreeClickableObject.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		case 0: // object3d
			this.object3d = data
			break
		case 1: // text
			this.text = data
			break
		default:
			break
		}
	}

	ThreeClickableObject.prototype.update_output = function() {
		return this.object3d
	}

	ThreeClickableObject.prototype.update_state = function() {

		if (this.object3d) {
			this.object3d.onClick = {text: this.text}
		}
	}
})()