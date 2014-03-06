var assert = require('assert');
var Graph = require('../browser/scripts/graph').Graph;

describe('Graph', function() {
	var graph;
	var dummyPlugin = { output_slots: [ 'a' ] }

	beforeEach(function() {
		global.Registers = function() {}

		var core = {
			get_graph_uid: function() {
				return 'uid'
			}
		}
		graph = new Graph(core, null, null)
	})

	it('should register node', function() {
		graph.register_node({ plugin: dummyPlugin })
		assert.equal(graph.nodes.length, 1)
	})

	it('should deregister node', function(done) {
		var n = { plugin: dummyPlugin }
		Array.prototype.remove = function(o) {
			assert.equal(n,o)
			done()
		}
		graph.register_node(n)
		graph.unregister_node(n)
	})

})
