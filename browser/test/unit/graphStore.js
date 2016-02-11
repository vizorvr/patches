var assert = require('assert');
var when = require('when')

global.EventEmitter = require('events').EventEmitter
global.Store = require('../../scripts/stores/store')

var GraphStore = require('../../scripts/stores/graphStore')
var Node = require('../../scripts/node').Node

describe('GraphStore', function() {
	var graph, node

	beforeEach(function() {
		global.E2 = {
			uid: function() {
				return '' + Math.random()
			},
			core: {
				root_graph: {}
			},
			app: {
				dispatcher: {
					register: function(){}
				}
			}
		}

		graph = { addNode: function() {} }
		node = new Node()
		node.plugin = { id: 'url_texture_generator' }
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
