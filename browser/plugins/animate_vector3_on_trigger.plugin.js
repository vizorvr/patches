(function() {

	var AnimateVector3OnTrigger = E2.plugins.animate_vector3_on_trigger = function(core, node) {
		AbstractAnimateValueOnTriggerPlugin.apply(this, [core, node, E2.dt.VECTOR, function(a, b, f) {
			return new THREE.Vector3(a.x, a.y, a.z).lerp(b, f)
		}])
	}

	AnimateVector3OnTrigger.prototype = Object.create(AbstractAnimateValueOnTriggerPlugin.prototype)

})()
