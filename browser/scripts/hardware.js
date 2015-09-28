var hardware = new function() {
	var that = this;
	this.hmd = null;
	this.sensor = null;

	this.enumerateVRDevices = function(devices) {
		var hmd = null, sensor = null;

		for(var i = 0; i < devices.length; i++) {
			if(devices[i] instanceof HMDVRDevice) {
				// Just use the first device we find for now.
				hmd = devices[i];
				break;
			}
		}

		if(hmd) {
			for(var i = 0; i < devices.length; i++) {
				var d = devices[i];

				if(d instanceof PositionSensorVRDevice && d.hardwareUnitId === hmd.hardwareUnitId) {
					sensor = devices[i];
					break;
				}
			}
		}

		this.hmd = hmd;
		this.sensor = sensor;
		return this;
	};

	// executes callback if VR present and returns true, or returns false if no VR
	this.ifVR = function(thenCallback) {
		if(navigator.getVRDevices) {	// webvr-polyfill
			navigator.getVRDevices().then(thenCallback)
		} else if(navigator.mozGetVRDevices) {
			navigator.mozGetVRDevices(thenCallback)
		} else {
			return false;
		}
		return true;
	};
}