(function() {

	var AnimateFloatOnTrigger = E2.plugins.animate_float_on_trigger = function (core, node) {
		AbstractAnimateValueOnTriggerPlugin.apply(this, [core, node, E2.dt.FLOAT, function (a, b, f) {
			return a + (b - a) * f
		}])
	}

	AnimateFloatOnTrigger.prototype = Object.create(AbstractAnimateValueOnTriggerPlugin.prototype)
})()