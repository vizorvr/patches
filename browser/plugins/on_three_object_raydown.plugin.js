(function() {
	var OnThreeObjectRayDown = E2.plugins.on_three_object_raydown = function() {
		AbstractObjectRayPlugin.apply(this, arguments)

		this.desc = 'Emits an impulse or continuous signal when the ray is down on the selected object (button is pressed). ' +
			'The name in the pulldown refers to the name of a Mesh patch.'
	}

	OnThreeObjectRayDown.prototype = Object.create(AbstractObjectRayPlugin.prototype)

	OnThreeObjectRayDown.prototype.onRayDown = function() {
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1

		E2.track({
			event: 'raydown',
			item: this.targetNode.uid
		})
	}

	OnThreeObjectRayDown.prototype.onRayOut = function() {
		this.triggerState = false
		this.updated = true
		this.node.queued_update = 1
	}
})()
