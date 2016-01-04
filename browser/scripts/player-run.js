(function() {

function progress(pct) {
	var $progress = $('.progress-bar')

	$('.progress').show()

	if (pct === 100)
		$('.progress').hide()

	$progress.css('width', pct + '%')
}

window.playVizorFile = function playVizorFile() {
	var $canvas = $('canvas[data-graph-url]')
    var url = $canvas.data('graph-url')
    return E2.app.player.loadAndPlay(url)
}

function onCoreReady() {
	var $canvas = $('canvas[data-graph-url]')
	var autoplay = $canvas.data('autoplay')

	E2.core.on('progress', progress)

	E2.app.player.stop()
	E2.app.player.on_update()

	mixpanel.track('Player Opened')

	if (autoplay) {
		var url = $canvas.data('graph-url')
		E2.app.player.loadAndPlay(url, autoplay)
	}

	$(window).trigger('vizorLoaded')
}

function findVrDevices(devices) {
	var hmd = null, sensor = null;

	devices.some(function(device) {
		if (device instanceof HMDVRDevice) {
			// Just use the first device we find for now.
			hmd = device;
			return true;
		}
	});

	if (hmd) {
		devices.some(function(d) {
			if (d instanceof PositionSensorVRDevice && d.hardwareUnitId === hmd.hardwareUnitId) {
				sensor = d;
				return true;
			}
		});
	}

	CreatePlayer([hmd, sensor], onCoreReady);
}

$(document).ready(function() {
	if(navigator.getVRDevices)
		navigator.getVRDevices().then(findVrDevices);
	else if(navigator.mozGetVRDevices)
		navigator.mozGetVRDevices(findVrDevices);
	else
		CreatePlayer([null, null], onCoreReady);
});

})()