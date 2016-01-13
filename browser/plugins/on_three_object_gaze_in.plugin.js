(function() {
	var OnThreeObjectGazeIn = E2.plugins.on_three_object_gaze_in = function() {
		AbstractObjectGazePlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the viewer\'s gaze is selected object is gazed. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'
	}

	OnThreeObjectGazeIn.prototype = Object.create(AbstractObjectGazePlugin.prototype)

	OnThreeObjectGazeIn.prototype.onGazeIn = function() {
		this.focused = true
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectGazeIn.prototype.onGazeOut = function() {
		this.focused = false
		this.triggerState = false
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectGazeIn.prototype.update_state = function() {
		if (this.lastState === this.triggerState && this.state.type === 0) {
			this.triggerState = false
		}

		if (!this.focused)
			this.triggerState = false

		this.lastState = this.triggerState
	}

})()
