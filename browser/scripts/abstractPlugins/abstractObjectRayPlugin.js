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

	function AbstractObjectRayPlugin(core) {
		Plugin.apply(this, arguments)

		this.input_slots = []

		this.output_slots = [
			{ name: 'trigger', dt: core.datatypes.BOOL }
		]

		this.boundOnRayOver = this.onRayOver.bind(this)
		this.boundOnRayOut = this.onRayOut.bind(this)
		this.boundOnRayUp = this.onRayUp.bind(this)
		this.boundOnRayDown = this.onRayDown.bind(this)
		this.boundSetupChosenObject = this.setupChosenObject.bind(this)
		this.boundOnGraphNodesChanged = this.onGraphNodesChanged.bind(this)

		this.node.on('pluginStateChanged', this.boundSetupChosenObject)

		this.state.nodeRef = null

		this.triggerState = false
		this.lastState = false
	}

	AbstractObjectRayPlugin.prototype = Object.create(Plugin.prototype)

	AbstractObjectRayPlugin.prototype.onRayOver = function() {}
	AbstractObjectRayPlugin.prototype.onRayOut = function() {}
	AbstractObjectRayPlugin.prototype.onRayUp = function() {}
	AbstractObjectRayPlugin.prototype.onRayDown = function() {}

	AbstractObjectRayPlugin.prototype.reset = function() {
		this.graph = this.node.parent_graph
	}

	AbstractObjectRayPlugin.prototype.destroy = function() {
		this.clearClickerOnObject()
	}

	AbstractObjectRayPlugin.prototype.installClickerOnObject = function() {
		if (!this.object3d.gazeClickers)
			this.object3d.gazeClickers = {}

		if (this.object3d.gazeClickers[this.node.uid])
			return;

		this.object3d.gazeClickers[this.node.uid] = true
		this.object3d.gazeClickerCount = Object.keys(this.object3d.gazeClickers).length

		E2.app.player.rayInput.add(this.object3d)

		var obj = this.object3d
		while(obj) {
			if (!obj.gazeClickerCount)
				obj.gazeClickerCount = 0
			obj.gazeClickerCount++
			obj = obj.parent
		}

		this.targetNode.plugin.updated = true

		E2.app.player.scene.hasClickableObjects = true

		E2.core.runtimeEvents.on('rayout:'+this.object3d.uuid, this.boundOnRayOut)
		E2.core.runtimeEvents.on('rayover:'+this.object3d.uuid, this.boundOnRayOver)
		E2.core.runtimeEvents.on('raydown:'+this.object3d.uuid, this.boundOnRayDown)
		E2.core.runtimeEvents.on('rayup:'+this.object3d.uuid, this.boundOnRayUp)
	}

	AbstractObjectRayPlugin.prototype.clearClickerOnObject = function() {
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

		E2.core.runtimeEvents.off('rayout:'+this.object3d.uuid, this.boundOnRayOut)
		E2.core.runtimeEvents.off('rayover:'+this.object3d.uuid, this.boundOnRayOver)
		E2.core.runtimeEvents.off('raydown:'+this.object3d.uuid, this.boundOnRayDown)
		E2.core.runtimeEvents.off('rayup:'+this.object3d.uuid, this.boundOnRayUp)

		this.object3d = undefined
	}

	AbstractObjectRayPlugin.prototype.setupChosenObject = function() {
		if (!this.state.nodeRef)
			return this.clearClickerOnObject()

		var oref = this.state.nodeRef.split('.')
		var guid = oref[0]
		var nuid = oref[1]
		var graph = Graph.lookup(guid)

		if (!graph) {
			console.warn('AbstractObjectRayPlugin.setupChosenObject() could not find Graph', guid)
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

	AbstractObjectRayPlugin.prototype.populateObjectSelector = function() {
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

	AbstractObjectRayPlugin.prototype.onGraphNodesChanged = function() {
		this.populateObjectSelector()
	}

	AbstractObjectRayPlugin.prototype.create_ui = function() {
		var that = this

		var $ui = make('div')

		$selectObject.change(function() {
			var selection = $selectObject.val()
			if (selection === 0)
				selection = null
			that.undoableSetState('nodeRef', selection, that.state.nodeRef)
		})

		$ui.append(this.$selectObject)

		// if nodes change in this current graph, update selector
		this.graph.on('nodeAdded', this.boundOnGraphNodesChanged)
		this.graph.on('nodeRemoved', this.boundOnGraphNodesChanged)
		this.graph.on('nodeRenamed', this.boundOnGraphNodesChanged)

		return $ui
	}

	AbstractObjectRayPlugin.prototype.destroy_ui = function() {
		this.graph.off('nodeAdded', this.boundOnGraphNodesChanged)
		this.graph.off('nodeRemoved', this.boundOnGraphNodesChanged)
		this.graph.off('nodeRenamed', this.boundOnGraphNodesChanged)
	}

	AbstractObjectRayPlugin.prototype.update_output = function() {
		return this.triggerState
	}

	AbstractObjectRayPlugin.prototype.update_state = function() {
		if (this.lastState)
			this.triggerState = false

		this.lastState = this.triggerState
	}

	AbstractObjectRayPlugin.prototype.state_changed = function(ui) {
		if (ui) {
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

	window.AbstractObjectRayPlugin = AbstractObjectRayPlugin

	if (typeof(module) !== 'undefined')
		module.exports = AbstractObjectRayPlugin
})();

