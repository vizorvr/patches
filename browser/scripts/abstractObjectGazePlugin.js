(function() {
	var meshPlugins = ['three_mesh']

	function findMeshNodes(graph) {
		var meshNodes = []

		function findInGraph(subgraph) {
			if (!subgraph.nodes)
				return

			subgraph.nodes.map(function(node) {
				if (node.plugin.id === 'graph')
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

		return findMeshNodes(E2.core.active_graph)
		.map(function(meshNode) {
			var title = meshNode.plugin.inputValues.name || 
				meshNode.title || 
				meshNode.id

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

	var AbstractObjectGazePlugin = function(core) {
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

		this.node.on('pluginStateChanged', function() {
			that.setupChosenObject()
		})

		this.state.type = 0

		this.triggerState = false
	}

	AbstractObjectGazePlugin.prototype = Object.create(Plugin.prototype)

	AbstractObjectGazePlugin.prototype.onGazeIn = function() {}
	AbstractObjectGazePlugin.prototype.onGazeOut = function() {}
	AbstractObjectGazePlugin.prototype.onGazeClicked = function() {}

	AbstractObjectGazePlugin.prototype.destroy = function() {
		this.clearObjectBinding()
	}

	AbstractObjectGazePlugin.prototype.clearObjectBinding = function() {
		if (this.object3d) {
			E2.core.runtimeEvents.off('gazeOut:'+this.object3d.uuid, this.boundOnGazeOut)
			E2.core.runtimeEvents.off('gazeIn:'+this.object3d.uuid, this.boundOnGazeIn)
			E2.core.runtimeEvents.off('gazeClicked:'+this.object3d.uuid, this.boundOnGazeClicked)
		}
	}

	AbstractObjectGazePlugin.prototype.setupChosenObject = function() {
		if (!this.state.nodeRef)
			return

		var oref = this.state.nodeRef.split('.')
		var guid = oref[0]
		var nuid = oref[1]
		var graph = Graph.lookup(guid)
		var node = graph.findNodeByUid(nuid)

		if (this.object3d === node.plugin.object3d)
			return

		if (this.targetNode)
			this.targetNode.off('meshChanged', this.boundSetupChosenObject)

		this.targetNode = node
		this.targetNode.on('meshChanged', this.boundSetupChosenObject)

		this.clearObjectBinding()

		this.object3d = node.plugin.object3d
		this.object3d.clickable = true

		E2.core.runtimeEvents.on('gazeOut:'+this.object3d.uuid, this.boundOnGazeOut)
		E2.core.runtimeEvents.on('gazeIn:'+this.object3d.uuid, this.boundOnGazeIn)
		E2.core.runtimeEvents.on('gazeClicked:'+this.object3d.uuid, this.boundOnGazeClicked)
	}

	AbstractObjectGazePlugin.prototype.populateObjectSelector = function() {
		var that = this

		$('<option>', { value: 0, text: 'Select Object' })
			.appendTo(that.$selectObject)

		findSelectableMeshNodes()
		.map(function(selectable) {
			$('<option>', {
				value: selectable.node.parent_graph.uid + '.' + selectable.node.uid,
				text: selectable.title
			})
			.appendTo(that.$selectObject)
		})
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
			that.undoableSetState('nodeRef', $selectObject.val(), that.state.nodeRef)
		})

		$selectType.change(function() {
			that.undoableSetState('type', $selectType.val(), that.state.type)
		})

		$ui.append(this.$selectObject)
		$ui.append($selectType)

		return $ui
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
			if (this.state.nodeRef)
				this.setupChosenObject()
		}
	}

	window.AbstractObjectGazePlugin = AbstractObjectGazePlugin
})()