var hardware = new function() {
	var that = this;
	this.hmd = null;
	this.sensor = null;
	this.enumerated = false;

	this.enumerateVRDevices = function(devices) {
		var hmd = null, sensor = null;

		var haveHMDVR = typeof HMDVRDevice !== 'undefined'
		var havePositionSensors = typeof PositionSensorVRDevice !== 'undefined'

		var d, isHmd, isSensor
		for(var i = 0; i < devices.length; i++) {
			d = devices[i]
			isHmd = haveHMDVR && (d instanceof HMDVRDevice)
			if (!isHmd) {
				if (d instanceof VRDisplay) {
					isHmd = d.capabilities.canPresent
				}
			}

			if (isHmd) {
				// Just use the first device we find for now.
				hmd = devices[i];
				break;
			}
		}

		if(hmd) {
			for(var i = 0; i < devices.length; i++) {
				d = devices[i];
				isSensor = (havePositionSensors && d instanceof PositionSensorVRDevice)
				if (!isSensor) {
					if (d instanceof VRDisplay){
						isSensor = d.capabilities.hasOrientation
					}
				}

				if (isSensor && d.hardwareUnitId === hmd.hardwareUnitId) {
					sensor = devices[i];
					break;
				}
			}
		}

		this.hmd = hmd;
		this.sensor = sensor;
		this.enumerated = true;

		return this;
	};

	// executes callback if VR present and returns true, or returns false if no VR
	this.ifVR = function(thenCallback) {
		if(navigator.getVRDisplays) {	// webvr-polyfill
			// navigator.getVRDisplays().then(thenCallback)
			navigator.getVRDisplays()
				.then(thenCallback, function(err){console.error(err)})
		} else if(navigator.mozGetVRDevices) {
			navigator.mozGetVRDevices(thenCallback)
		} else {
			return false;
		}
		return true;
	};
}