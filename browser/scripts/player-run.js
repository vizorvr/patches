(function() {

window.playVizorFile = function() {
	return E2.app.player.loadAndPlay(readUrl())
}

function readUrl() {
	var $canvas = $('canvas[data-graph-url]')
	var url = $canvas.data('graph-url')
	return url
}

function onCoreReady() {
	E2.app.player.on_update()

	E2.track({
		event: 'playerOpened',
		path: readUrl()
	})

	$(window).trigger('vizorLoaded')

	if (Vizor.autoplay)
		window.playVizorFile()
}

$(document).ready(function()  {
	CreatePlayer(onCoreReady)
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

