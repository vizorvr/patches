(function() {
	var OnThreeObjectGazeOut = E2.plugins.on_three_object_gaze_out = function() {
		AbstractObjectGazePlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the viewer\'s gaze leaves the selected object. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'

		this.triggerState = true
	}

	OnThreeObjectGazeOut.prototype = Object.create(AbstractObjectGazePlugin.prototype)

	OnThreeObjectGazeOut.prototype.onGazeIn = function() {
		this.focused = true
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectGazeOut.prototype.onGazeOut = function() {
		this.focused = false
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectGazeOut.prototype.update_state = function() {
		this.triggerState = !this.focused

		if (this.lastState === this.triggerState && this.state.type === 0) {
			this.triggerState = false
		} 

		this.lastState = this.triggerState
	}

})()
