var assert = require('assert');

global.EventEmitter = require('events').EventEmitter
global.Store = require('../../scripts/stores/store')

var GraphStore = require('../../scripts/stores/graphStore')
var Node = require('../../scripts/node').Node

describe('GraphStore', function() {
	var graph, node

	global.E2 = {
		uid: function() {
			return '' + Math.random()
		},
		app: {
			dispatcher: {
				register: function(){}
			}
		}
	}

	beforeEach(function() {
		graph = { addNode: function() {} }
		node = new Node()
		node.plugin = {}
	})

	describe('uiNodeAdded', function() {
		it('calls reset on node', function(done) {
			var gs = new GraphStore()
			node.reset = done
			gs._uiNodeAdded(graph, node)
		})

		it('calls initialise on node', function(done) {
			var gs = new GraphStore()
			node.initialise = done
			gs._uiNodeAdded(graph, node)
		})
	})

})
