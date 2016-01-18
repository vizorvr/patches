(function() {
	var ArrayBlendFloat = E2.plugins.array_blend_modulator_float = function(core, node) {
		AbstractArrayBlendModulatorPlugin.apply(this, [core, node, E2.dt.FLOAT, function(a, b, f) {
			return a + (b - a) * f
		}])
	}

	ArrayBlendFloat.prototype = Object.create(AbstractArrayBlendModulatorPlugin.prototype)
})()
