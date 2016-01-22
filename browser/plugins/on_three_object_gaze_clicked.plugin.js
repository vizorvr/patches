(function() {
	var OnThreeObjectGazeClicked = E2.plugins.on_three_object_gaze_clicked = function() {
		AbstractObjectGazePlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the selected object is gazed. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'
	}

	OnThreeObjectGazeClicked.prototype = Object.create(AbstractObjectGazePlugin.prototype)

	OnThreeObjectGazeClicked.prototype.onGazeClicked = function() {
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1
	}

	AbstractObjectGazePlugin.prototype.onGazeOut = function() {
		this.triggerState = false
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectGazeClicked.prototype.update_state = function() {
		if (this.lastState === this.triggerState && this.state.type === 0) {
			this.triggerState = false
		}

		if (!this.focused)
			this.triggerState = false

		this.lastState = this.triggerState
	}

})()
