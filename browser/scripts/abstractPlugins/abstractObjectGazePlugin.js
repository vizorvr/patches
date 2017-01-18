(function() {
	var meshPlugins = ['three_mesh']

	function findMeshNodes(graph) {
		var meshNodes = []

		function findInGraph(subgraph) {
			if (!subgraph.nodes)
				return

			subgraph.nodes.map(function(node) {
				if (E2.GRAPH_NODES.indexOf(node.plugin.id) > -1)
					return findInGraph(node.plugin.graph)

				if (meshPlugins.indexOf(node.plugin.id) === -1)
					return

				meshNodes.push(node)
			})
		}

		findInGraph(graph)

		return meshNodes
	}

	function findSelectableMeshNodes() {
		var titleCounters = {}

		return findMeshNodes(E2.core.root_graph)
		.map(function(meshNode) {
			var title = 'Mesh'

			if (meshNode.parent_graph.plugin)
				title = meshNode.parent_graph.plugin.node.title

			if (titleCounters[title])
				title = title + ' ' + (++titleCounters[title])
			else
				titleCounters[title] = 1

			return {
				title: title,
				node: meshNode
			}
		})

		return selectables
	}

	function AbstractObjectGazePlugin(core) {
		var that = this

		Plugin.apply(this, arguments)

		this.input_slots = []

		this.output_slots = [
			{ name: 'trigger', dt: core.datatypes.BOOL }
		]

		this.boundOnGazeIn = this.onGazeIn.bind(this)
		this.boundOnGazeOut = this.onGazeOut.bind(this)
		this.boundOnGazeClicked = this.onGazeClicked.bind(this)
		this.boundSetupChosenObject = this.setupChosenObject.bind(this)
		this.boundOnGraphNodesChanged = this.onGraphNodesChanged.bind(this)

		this.node.on('pluginStateChanged', this.boundSetupChosenObject)

		this.state.nodeRef = null
		this.state.type = 0

		this.triggerState = false
	}

	AbstractObjectGazePlugin.prototype = Object.create(Plugin.prototype)

	AbstractObjectGazePlugin.prototype.reset = function() {
		this.graph = this.node.parent_graph
	}

	AbstractObjectGazePlugin.prototype.onGazeIn = function() {}
	AbstractObjectGazePlugin.prototype.onGazeOut = function() {}
	AbstractObjectGazePlugin.prototype.onGazeClicked = function() {}

	AbstractObjectGazePlugin.prototype.destroy = function() {
		this.clearClickerOnObject()
	}

	AbstractObjectGazePlugin.prototype.installClickerOnObject = function() {
		if (!this.object3d.gazeClickers)
			this.object3d.gazeClickers = {}

		if (this.object3d.gazeClickers[this.node.uid])
			return;

		E2.app.player.rayInput.add(this.object3d)

		this.object3d.gazeClickers[this.node.uid] = true
		this.object3d.gazeClickerCount = Object.keys(this.object3d.gazeClickers).length

		var obj = this.object3d
		while(obj) {
			if (!obj.gazeClickerCount)
				obj.gazeClickerCount = 0
			obj.gazeClickerCount++
			obj = obj.parent
		}

		this.targetNode.plugin.updated = true

		E2.app.player.scene.hasClickableObjects = true

		E2.core.runtimeEvents.on('gazeOut:'+this.object3d.uuid, this.boundOnGazeOut)
		E2.core.runtimeEvents.on('gazeIn:'+this.object3d.uuid, this.boundOnGazeIn)
		E2.core.runtimeEvents.on('gazeClicked:'+this.object3d.uuid, this.boundOnGazeClicked)
	}

	AbstractObjectGazePlugin.prototype.clearClickerOnObject = function() {
		if (!this.object3d)
			return;

		if (!this.object3d.gazeClickers || !this.object3d.gazeClickers[this.node.uid])
			return;

		E2.app.player.rayInput.remove(this.object3d)

		delete this.object3d.gazeClickers[this.node.uid]

		this.object3d.gazeClickerCount = Object.keys(this.object3d.gazeClickers).length

		var obj = this.object3d.parent
		while(obj) {
			obj.gazeClickerCount--
			obj = obj.parent
		}

		this.targetNode.plugin.updated = true

		E2.core.runtimeEvents.off('gazeOut:'+this.object3d.uuid, this.boundOnGazeOut)
		E2.core.runtimeEvents.off('gazeIn:'+this.object3d.uuid, this.boundOnGazeIn)
		E2.core.runtimeEvents.off('gazeClicked:'+this.object3d.uuid, this.boundOnGazeClicked)

		this.object3d = undefined
	}

	AbstractObjectGazePlugin.prototype.setupChosenObject = function() {
		if (!this.state.nodeRef)
			return this.clearClickerOnObject()

		var oref = this.state.nodeRef.split('.')
		var guid = oref[0]
		var nuid = oref[1]
		var graph = Graph.lookup(guid)

		if (!graph) {
			console.warn('AbstractObjectGazePlugin.setupChosenObject() could not find Graph', guid)
			return;
		}

		var node = graph.findNodeByUid(nuid)

		if (!node || (this.object3d && this.object3d === node.plugin.object3d))
			return

		this.clearClickerOnObject()

		if (this.targetNode)
			this.targetNode.off('meshChanged', this.boundSetupChosenObject)

		this.targetNode = node
		this.targetNode.on('meshChanged', this.boundSetupChosenObject)

		if (!node.plugin.object3d) // might not have been set up yet, wait for meshChanged
			return;

		this.object3d = node.plugin.object3d
		this.installClickerOnObject()

		// set the Mesh plugin to updated, to update the Scene as clickable
		this.targetNode.plugin.updated = true 
	}

	AbstractObjectGazePlugin.prototype.populateObjectSelector = function() {
		var that = this

		that.$selectObject.empty()

		$('<option>', { value: 0, text: 'Select Object' })
			.appendTo(that.$selectObject)

		findSelectableMeshNodes()
		.map(function(selectable) {
			var nodeRef = selectable.node.getFullUid()
			$('<option>', {
				value: nodeRef,
				selected: nodeRef === that.state.nodeRef,
				text: selectable.title
			})
			.appendTo(that.$selectObject)
		})
	}

	AbstractObjectGazePlugin.prototype.onGraphNodesChanged = function() {
		this.populateObjectSelector()
	}

	AbstractObjectGazePlugin.prototype.create_ui = function() {
		var that = this

		var $ui = make('div')

		var $selectType = $('<select class="trigger-type-sel" title="Select Trigger Type"/>')
		var $selectObject = 
			this.$selectObject = $('<select class="object-sel" title="Select Object"/>')

		this.populateObjectSelector()

		$('<option>', { value: 0, text: 'Impulse' }).appendTo($selectType)
		$('<option>', { value: 1, text: 'Continuous' }).appendTo($selectType)

		$selectObject.change(function() {
			var selection = $selectObject.val()
			if (selection === 0)
				selection = null
			that.undoableSetState('nodeRef', selection, that.state.nodeRef)
		})

		$selectType.change(function() {
			that.undoableSetState('type', 
				parseInt($selectType.val(), 10), 
				that.state.type)
		})

		$ui.append(this.$selectObject)
		$ui.append($selectType)

		// if nodes change in this current graph, update selector
		this.graph.on('nodeAdded', this.boundOnGraphNodesChanged)
		this.graph.on('nodeRemoved', this.boundOnGraphNodesChanged)
		this.graph.on('nodeRenamed', this.boundOnGraphNodesChanged)

		return $ui
	}

	AbstractObjectGazePlugin.prototype.destroy_ui = function() {
		this.graph.off('nodeAdded', this.boundOnGraphNodesChanged)
		this.graph.off('nodeRemoved', this.boundOnGraphNodesChanged)
		this.graph.off('nodeRenamed', this.boundOnGraphNodesChanged)
	}

	AbstractObjectGazePlugin.prototype.update_output = function() {
		return this.triggerState
	}

	AbstractObjectGazePlugin.prototype.onGazeIn = function() {
		this.focused = true
		this.updated = true
	}

	AbstractObjectGazePlugin.prototype.onGazeOut = function() {
		this.focused = false
		this.updated = true
	}

	AbstractObjectGazePlugin.prototype.onGazeClicked = function() {
		this.triggerState = true
		this.updated = true
		this.node.queued_update = 1
	}

	AbstractObjectGazePlugin.prototype.update_state = function() {
		if (this.lastState === this.triggerState && this.state.type === 0) {
			this.triggerState = false
		}

		if (!this.focused)
			this.triggerState = false

		this.lastState = this.triggerState
	}

	AbstractObjectGazePlugin.prototype.state_changed = function(ui) {
		if (ui) {
			if (this.state.type)
				ui.find('.trigger-type-sel').val(this.state.type)
	
			if (this.state.nodeRef)
				ui.find('.object-sel').val(this.state.nodeRef)
		} else {
			if (this.state.nodeRef) {
				this.setupChosenObject()
			} else {
				// default to containing Entity
				if (this.node.parent_graph.plugin instanceof AbstractEntityPlugin) {
					var meshNodes = findMeshNodes(this.node.parent_graph)
					if (!meshNodes.length)
						return;
					this.state.nodeRef = meshNodes[0].getFullUid()
					this.setupChosenObject()
				}
			}
		}
	}

	window.AbstractObjectGazePlugin = AbstractObjectGazePlugin

	if (typeof(module) !== 'undefined')
		module.exports = AbstractObjectGazePlugin
})();

