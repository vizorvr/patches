(function() {

var LoadGraphOnTrigger = E2.plugins.load_graph_on_trigger = function(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Loads and plays the Vizor file (replacing the current one) on trigger'

	this.input_slots = [{
		name: 'trigger', 
		dt: core.datatypes.BOOL,
		desc: 'When trigger is true, the URL will be loaded in the player',
		def: null
	}, {
		name: 'url',
		dt: core.datatypes.TEXT,
		desc: 'Relative URL to published Vizor file, eg. /fthr/moon',
		def: null
	}]

	this.output_slots = []
}

LoadGraphOnTrigger.prototype.update_input = function(slot, data) {
	Plugin.prototype.update_input.apply(this, arguments)

	if (slot.name === 'trigger' && data && this.inputValues.url) {
		var givenUrlParts = this.inputValues.url.split('/')
		var graphPath = '/' + givenUrlParts.splice(-2, 2).join('/')

		console.log('loading', graphPath)

		// in the editor
		if (E2.app && E2.app.navigateToPublishedGraph)
			return E2.app.navigateToPublishedGraph(graphPath)

		// in the player
		var graphUrl = '/data/graph' + graphPath + '.min.json'
		E2.app.player.load_from_url(graphUrl, function() {
			E2.app.player.play()
		})
	}
}	

})()