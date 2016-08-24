var assert = require('assert');
var fs = require('fs')

var reset = require('./helpers').reset;

describe('Redo complex connection', function() {
	beforeEach(function() {
		reset()

		app = E2.app

		E2.plugins.convert_camera_matrices = function(core) {
				this.input_slots = [
					{ name: 'camera', dt: core.datatypes.CAMERA },
				]
				this.output_slots = [
					{ name: 'projection', dt: core.datatypes.MATRIX},
					{ name: 'view', dt: core.datatypes.MATRIX }
				]
		}

		E2.plugins.material_texture_modulator = function(core, node) {
			this.input_slots = [ 
				{ name: 'material', dt: core.datatypes.MATERIAL},
				{ name: 'type', dt: core.datatypes.FLOAT},
				{ name: 'texture', dt: core.datatypes.TEXTURE }
			];
			
			this.output_slots = [
				{ name: 'material', dt: core.datatypes.MATERIAL }
			];
		};

		source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/issue195.json')).root
	})

	it('can redo connection after destructive edits in subgraph, issue #195', function() {
		app.setupStoreListeners()

		// add VR clean template
		app.pasteObject(source)
		
		var rootGraph = E2.core.active_graph
		rootGraph.create_ui = function(){}
		rootGraph.tree_node = {}
		
		// open the VR render loop
		var vrLoopGraph = rootGraph.children[0].plugin.graph
		vrLoopGraph.create_ui = function(){}
		vrLoopGraph.tree_node = {}
		
		app.onGraphSelected(vrLoopGraph)

		// select all, delete
		app.clearSelection()
		vrLoopGraph.nodes.map(function(node) {
			app.markNodeAsSelected(node)
		})

		assert.equal(app.selectedNodes.length, 2)

		app.onDelete()

		// back to root graph
		app.onGraphSelected(rootGraph)

		// undo, undo, redo
		app.undoManager.undo() // undo deletion inside subgraph
		app.undoManager.undo() // undo addition of pasted nodes
		assert.doesNotThrow(function() {
			app.undoManager.redo() // redo pasted nodes
		})

	})

})

	
