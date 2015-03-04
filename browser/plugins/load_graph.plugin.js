(function() {

var LoadGraph = E2.plugins['load_graph'] = function(core, node) {
	this.desc = 'Instructs the player to play the graph (replacing the current graph)'
	
	this.input_slots = [
		{ name: 'json', dt: core.datatypes.TEXT, desc: 'Graph JSON to play', def: null }
	]
	
	this.output_slots = []
}

LoadGraph.prototype.update_input = function(slot, data) {
	if (slot.index === 0 && data) {
		E2.app.player.load_from_json(data)
		E2.app.player.play()
	}
}	

})()