(function() {
	var OnThreeObjectRayOut = E2.plugins.on_three_object_rayout = function() {
		AbstractObjectRayPlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the viewer\'s ray leaves the selected object. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'

		this.triggerState = true
	}

	OnThreeObjectRayOut.prototype = Object.create(AbstractObjectRayPlugin.prototype)

	OnThreeObjectRayOut.prototype.onRayOver = function() {
		this.triggerState = false
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectRayOut.prototype.onRayOut = function() {
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1
	}

})()
