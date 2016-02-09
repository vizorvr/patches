(function() {

var loadingComplete = false

function progress(pct) {
	var progressNode = document.getElementById('progressbar')
	if (progressNode) progressNode.value = pct;
	if (pct == 100) {
		// sometimes we're called twice
		if (loadingComplete) return
		// loaded all assets
		$('body').addClass('assetsLoaded')
		loadingComplete = true
	}
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

$(document).ready(function()  {
	VizorUI.replaceSVGButtons(jQuery('header'))

	if(navigator.getVRDevices)
		navigator.getVRDevices().then(findVrDevices);
	else if(navigator.mozGetVRDevices)
		navigator.mozGetVRDevices(findVrDevices);
	else
		CreatePlayer([null, null], onCoreReady);
});

// postMessage API for setting variables in embedded files
window.addEventListener('message', function(e) {
	function send(message) {
		e.source.postMessage(message, e.origin)
	}

	switch(e.data.command) {
		case 'getVariable':
			send({
				value: E2.app.player.getVariableValue(e.data.name)
			})
			break;

		case 'setVariable':
			E2.app.player.setVariableValue(e.data.name, e.data.value)
			break;
	}
}, false)


})()

