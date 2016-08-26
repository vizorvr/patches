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

// the functions below are required by eg. 0.8
hardware.sensor = null

// @deprecated
hardware.ifVR = function(cb) {
	return hardware.hmd || hardware.hasVRDisplays(cb)
}

// @deprecated
hardware.detect = function() {
	return hardware.ifVR()
}
