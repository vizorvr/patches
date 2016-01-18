(function() {
	var ArrayBlendVector3 = E2.plugins.array_blend_modulator_vector3 = function(core, node) {
		AbstractArrayBlendModulatorPlugin.apply(this, [core, node, E2.dt.VECTOR, function(a, b, f) {
			return new THREE.Vector3(a.x, a.y, a.z).lerp(b, f)
		}])
	}

	ArrayBlendVector3.prototype = Object.create(AbstractArrayBlendModulatorPlugin.prototype)
})()
