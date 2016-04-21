(function() {

window.playVizorFile = function playVizorFile() {
	var $canvas = $('canvas[data-graph-url]')
    var url = $canvas.data('graph-url')
    return E2.app.player.loadAndPlay(url)
}

function onCoreReady() {
	var $canvas = $('canvas[data-graph-url]')
	var autoplay = (window.Vizor) ? window.Vizor.autoplay : true

	// E2.app.player.stop()
	E2.app.player.on_update()

	if (typeof mixpanel !== 'undefined')
		mixpanel.track('Player Opened')

	if (autoplay) {
		var url = $canvas.data('graph-url')
		E2.app.player.loadAndPlay(url, autoplay)
	}

	$(window).trigger('vizorLoaded')
}

$(document).ready(function()  {
	hardware.detect()
	CreatePlayer([hardware.hmd, hardware.sensor], onCoreReady)
})

// postMessage API for setting variables in embedded files
window.addEventListener('message', function(e) {
	function send(message) {
		e.source.postMessage(message, e.origin)
	}

	switch(e.data.command) {
		case 'getVariable':
			send({
			name: e.data.name, 
			value: E2.app.player.getVariableValue(e.data.name)
			})
			break;

		case 'setVariable':
			E2.app.player.setVariableValue(e.data.name, e.data.value)
			break;
	}
}, false)


})()

