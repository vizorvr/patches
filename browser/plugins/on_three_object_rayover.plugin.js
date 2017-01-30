(function() {
	var OnThreeObjectRayOver = E2.plugins.on_three_object_rayover = function() {
		AbstractObjectRayPlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the viewer\'s ray is over the object. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'
	}

	OnThreeObjectRayOver.prototype = Object.create(AbstractObjectRayPlugin.prototype)

	OnThreeObjectRayOver.prototype.onRayOver = function() {
		this.focused = true
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1
	}

	OnThreeObjectRayOver.prototype.onRayOut = function() {
		this.focused = false
		this.triggerState = false
		this.updated = true
		this.node.queued_update = 1
	}


})()
