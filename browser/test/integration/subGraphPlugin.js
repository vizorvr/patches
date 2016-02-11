var assert = require('assert');
var reset = require('./helpers').reset;
var fs = require('fs')

describe('SubGraphPlugin-Complex', function() {
	beforeEach(function() {
		reset()

		E2.plugins.url_scene_generator = function(){
			this.input_slots = []
			this.output_slots = [ { name: 'x', dt: core.datatypes.BOOL } ]
		}

		app = E2.app
		core = E2.core

		source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/subGraphFloatOutput.json')).root

		app.paste(source, 0, 0)
	})

	var FloatConsumerPlugin = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Test plugin for consuming floats'

		this.input_slots = [
			{
				name: 'input',
				dt: core.datatypes.FLOAT
			}]

		this.output_slots = []
	}

	FloatConsumerPlugin.prototype = Object.create(Plugin.prototype)

	FloatConsumerPlugin.prototype.get_value = function(v) {
		return this.value
	}

	FloatConsumerPlugin.prototype.update_input = function(slot, data) {
		this.value = data
	}

	it('fetches numbers from subgraphs', function() {
		var ag = E2.core.active_graph

		var floatConsumerNode = new Node(ag, undefined, 0, 0)
		var floatConsumerPlugin = new FloatConsumerPlugin(E2.core, floatConsumerNode)
		floatConsumerNode.set_plugin(floatConsumerPlugin)
		floatConsumerPlugin.reset()

		ag.addNode(floatConsumerNode)

		var subgraph0 = ag.nodes[0]
		var subgraph1 = ag.nodes[1]
		var float0 = ag.nodes[2]

		var ss = subgraph0.dyn_outputs[0]
		var ds = floatConsumerNode.plugin.input_slots[0]
		var conn = new Connection(subgraph0, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		ag.update()

		var v = floatConsumerPlugin.get_value()
		assert(v, 1)

		ag.disconnect(conn)

		ss = subgraph1.dyn_outputs[0]

		conn = new Connection(subgraph1, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		var v = floatConsumerPlugin.get_value()
		assert(v, 2)

		ag.disconnect(conn)

		ss = float0.plugin.output_slots[0]

		conn = new Connection(float0, floatConsumerNode, ss, ds)
		ag.connect(conn)
		conn.patch_up(ag.nodes)

		var v = floatConsumerPlugin.get_value()
		assert(v, 3)
	})
})



