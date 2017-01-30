(function() {
	var OnThreeObjectRayUp = E2.plugins.on_three_object_rayup = function() {
		AbstractObjectRayPlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the input ray is up on the selected object. ' +
			'The name in the pulldown refers to the name of a Mesh patch.'
	}

	OnThreeObjectRayUp.prototype = Object.create(AbstractObjectRayPlugin.prototype)

	OnThreeObjectRayUp.prototype.onRayUp = function() {
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1

		E2.track({
			event: 'rayup',
			item: this.targetNode.uid
		})
	}

	OnThreeObjectRayUp.prototype.update_output = function() {
		return this.triggerState
	}

})()
