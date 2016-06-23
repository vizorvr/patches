var hardware = {}

hardware.hmd = null

hardware.getVRDisplays = function() {
	if (navigator.getVRDisplays) {
		return navigator.getVRDisplays()
		.then(function(vrDisplays) {
			var displays = vrDisplays.filter(function(display) {
				return display instanceof VRDisplay &&
					display.capabilities.canPresent
			})

			if (displays.length)
				hardware.hmd = displays[0]

			return hardware.hmd
		})
	} else {
		return when.resolve()
	}
}

hardware.hasVRDisplays = function() {
	return hardware.getVRDisplays()
	.then(function(display) {
		return !!display
	})
}
