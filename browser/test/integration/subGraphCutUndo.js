var assert = require('assert');
var fs = require('fs')

var helpers = require('./helpers')

describe('SubGraphCutUndo', function() {
	var core, app

	beforeEach(function() {
		core = helpers.reset()
		helpers.setupThree()

		E2.commands.graph = require('../../scripts/commands/graphEditCommands')
		require('../../scripts/util')

		app = E2.app
		app.player = { core: core }
		app.channel = { broadcast: function(){}}
		app.updateCanvas = function(){}
		global.E2.app = app
	})

	it('cuts all nodes inside a subgraph, pastes and reconnects arrayness', function() {

		var source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/subGraphCutUndo.json')).root

		app.paste(source, 0, 0)
		assert.equal(core.active_graph.nodes.length, 2)
		assert.equal(core.active_graph.connections.length, 1)

		var rootGraph = E2.core.root_graph

		E2.app.onGraphSelected(rootGraph.nodes[1].plugin.graph);

		E2.app.selectAll()
		E2.app.onCut()

		E2.app.undoManager.undo()

		var activeGraph = E2.core.active_graph

		rootGraph.update({abs_t: 0, delta_t: 1/60})

		assert.equal(rootGraph.nodes[1].dyn_outputs[0].array, activeGraph.nodes[2].dyn_inputs[0].array)
	})

})







