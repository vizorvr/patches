function WorldEditor(domElement) {
	this.domElement = domElement
	this.camera = new WorldEditorCamera(this.domElement)

	var active = false

	this.activate = function() {
		active = true
		this.transformControls.enabled = true
		this.editorControls.enabled = true
	}

	this.deactivate = function() {
		this.transformControls.enabled = false
		this.editorControls.enabled = false
		if (this.editorTree.parent) {
			this.editorTree.parent.remove(this.editorTree)
		}
		active = false
	}

	this.isActive = function() {
		return active
	}

	this.transformMode = 'translate'

	this.editorTree = new THREE.Object3D()

	// grid around origin along x, z axises
	this.grid = new WorldEditorOriginGrid()
	this.editorTree.add(this.grid.mesh)

	// root for any selection bboxes
	this.selectionTree = new THREE.Object3D()
	this.editorTree.add(this.selectionTree)

	// root for 3d handles
	this.handleTree = new THREE.Object3D()
	this.editorTree.add(this.handleTree)

	// editor controls
	this.editorControls = new THREE.EditorControls(this.camera.perspectiveCamera, this.domElement)

	// transform controls
	this.transformControls = new THREE.TransformControls(this.camera.perspectiveCamera, this.domElement)

	this.cameraHelper = new VRCameraHelper()

	var that = this

	this.transformControls.addEventListener('mouseDown', function() {
		that.editorControls.enabled = false
		if (E2.app.alt_pressed) {
			E2.app.onCopy()
			E2.app.onPaste()
		}
	})

	this.transformControls.addEventListener('mouseUp', function() {
		that.editorControls.enabled = true
	})

	this.setupObjectPicking()

	E2.ui.state.on('changed:modifyMode', this.setTransformMode.bind(this));

}

WorldEditor.prototype.setTransformMode = function(mode) {
	this.transformMode = mode
}

WorldEditor.prototype.update = function() {
	if (!this.isActive()) {
		return
	}

	// update the reference grid scale based on camera distance from target
	var f = function(v, n) {
		if (v / 10 < n) { return n }
		return f(v, n * 10)
	}

	var len = this.camera.perspectiveCamera.position.clone().sub(this.editorControls.center).length() || 1
	var v = f(len, 0.01)

	this.grid.scale(v)

	// needs calling on every update otherwise the transform controls draw incorrectly
	this.transformControls.setMode(this.transformMode)
	this.transformControls.setSpace('local')
}

WorldEditor.prototype.preRenderUpdate = function() {
	// add the editor tree to the scene if it's not there already
	var editorIdx = this.scene.children.indexOf(this.editorTree)
	if (editorIdx < 0) {
		this.scene.add(this.editorTree)
	}
}

WorldEditor.prototype.getCamera = function() {
	return this.camera.perspectiveCamera
}

WorldEditor.prototype.updateScene = function(scene, camera) {
	this.scene = scene
	this.vrCamera = camera

	this.handleTree.children = []

	var that = this

	var nodeHandler = function ( node ) {
		if (node instanceof THREE.PointLight) {
			var helper = new THREE.PointLightHelper(node, 0.5)

			helper.backReference = node.backReference
			that.handleTree.add(helper)
		}
		else if (node instanceof THREE.DirectionalLight) {
			var helper = new THREE.DirectionalLightHelper(node, 0.5)

			helper.backReference = node.backReference
			that.handleTree.add(helper)
		}
	}

	// add handles for anything requiring them in the scene
	if (scene) {
		scene.children[0].traverse( nodeHandler )
	}

	// add handles for the camera helper
	this.cameraHelper.attachCamera(camera)
	this.handleTree.add(this.cameraHelper)

	// if there's a pending selection (something was pasted),
	// set selection accordingly
	if (this.pendingSelection !== undefined) {
		if (--this.pendingSelection.waitTime < 0) {
			var selectNodes = []

			for(var i = 0; i < this.pendingSelection.selection.length; ++i) {
				this.pendingSelection.selection[i].plugin.object3d.traverse(function(n) {
					if (n.backReference) {
						selectNodes.push(n)
					}
				})
			}

			this.setSelection(selectNodes)

			delete this.pendingSelection
		}
	}
}

WorldEditor.prototype.getEditorSceneTree = function() {
	return this.editorTree
}

WorldEditor.prototype.setSelection = function(selected) {
	this.selectionTree.children = []

	var anySelected = false

	for (var i = 0; i < selected.length; ++i) {
		var obj = selected[i]
		if (obj.backReference !== undefined) {
			this.transformControls.attach(obj)
			this.selectionTree.add(this.transformControls)

			anySelected = true
			// only attach to first valid item
			break
		}
	}

	if (!anySelected) {
		this.transformControls.detach()
	}
}

WorldEditor.prototype.onDelete = function(nodes) {
	this.transformControls.detach()
}

WorldEditor.prototype.onPaste = function(nodes) {
	if (!nodes || nodes.length < 1) {
		return
	}

	var dropNode = nodes[0]

	// find scene node
	var sceneNode = this.scene.backReference.parentNode

	sceneNode.slots_dirty = true

	var slots = sceneNode.getDynamicInputSlots()
	var slot = slots[slots.length - 1]

	function findObject3DOutput(node) {
		var staticSlots = node.plugin.output_slots
		for (var i = 0; i < staticSlots.length; ++i) {
			if (staticSlots[i].dt === E2.core.datatypes.OBJECT3D) {
				return {index: i, dynamic: false}
			}
		}

		// if it's not a static slot,
		// assume it's the first dynamic slot
		return {index: 0, dynamic: true}
	}

	var srcSlot = findObject3DOutput(dropNode)

	// connect the new patch to the scene
	var connection = Connection.hydrate(E2.core.root_graph, {
		src_nuid: dropNode.uid,
		dst_nuid: sceneNode.uid,
		src_slot: srcSlot.index,
		src_dyn: srcSlot.dynamic, // TODO: the src slot is not necessarily a dyn slot
		dst_slot: slot.index,
		dst_dyn: true
	})

	E2.app.graphApi.connect(E2.core.root_graph, connection)

	E2.app.onLocalConnectionChanged(connection)

	E2.app.markConnectionAsSelected(connection)

	// set a pending selection object for the pasted objects
	// we have to wait for one update to pass before actually
	// setting the selection, because mesh creation itself is
	// deferred in AbstractThreeMeshPlugin
	var pendingSelection = {waitTime: 1, selection: []}

	function collectMeshes(node) {
		if (node.plugin && node.plugin.object3d) {
			pendingSelection.selection.push(node)
		}

		if (node.plugin.graph) {
			for (var n = 0; n < node.plugin.graph.nodes.length; ++n) {
				collectMeshes(node.plugin.graph.nodes[n])
			}
		}
	}

	for (var i = 0; i < nodes.length; ++i) {
		var node = nodes[i]
		collectMeshes(node)
	}

	this.pendingSelection = pendingSelection

	// TODO: if this.pendingSelection.length === 0, we didn't paste any objects
	// and we could warn the user somehow
}

WorldEditor.prototype.selectMeshAndDependencies = function(meshNode, sceneNode) {
	var selectNodes = []

	function collectConnectingNodesBetween(curNode, endNode) {
		var allOutputs = curNode.outputs.concat(curNode.dyn_outputs)

		if (curNode.plugin.id === 'output_proxy' && curNode.parent_graph && curNode.parent_graph.plugin && curNode.parent_graph.plugin.parentNode) {
			if (collectConnectingNodesBetween(curNode.parent_graph.plugin.parentNode, sceneNode)) {
				// selected a whole subgraph node, don't recurse back into the subgraph
				return false
			}
		}

		for(var i = 0; i < allOutputs.length; ++i) {
			var candidateNode = allOutputs[i].dst_node

			var atEndNode = candidateNode === endNode

			var foundRouteToEnd =
					atEndNode ||
					(candidateNode ?
							collectConnectingNodesBetween(candidateNode, endNode) :
							false)

			if (foundRouteToEnd) {
				// go to the correct graph level for this node
				curNode.parent_graph.tree_node.activate()

				// select this node and recurse back in the graph to select the path via which we came here
				if (selectNodes.indexOf(curNode) === -1) {
					selectNodes.push(curNode)
				}

				return true
			}
		}

		return false
	}

	E2.app.clearSelection()

	if (meshNode) {
		// step 1:
		// collect nodes between mesh and scene
		collectConnectingNodesBetween(meshNode, sceneNode)

		if (selectNodes.length === 0) {
			// found nothing
			return
		}

		// step 2:
		// add any objects hidden in group hierarchies into selection
		var resolvedMeshNode = selectNodes[selectNodes.length - 1]
		var origSelection = selectNodes.slice(0)

		for (var i = 0; i < origSelection.length; ++i) {
			var node = origSelection[i]

			if (node.plugin.object3d) {
				node.plugin.object3d.traverse(function(obj) {
					if (obj.backReference && selectNodes.indexOf(obj.backReference.node) === -1) {
						collectConnectingNodesBetween(obj.backReference.node, sceneNode)
					}
				})
			}
		}

		// step 3:
		// select the collected nodes
		for (var i = 0; i < selectNodes.length; ++i) {
			E2.app.markNodeAsSelected(selectNodes[i])
			selectNodes[i].getConnections().map(E2.app.markConnectionAsSelected.bind(E2.app))
		}

	}
}

WorldEditor.prototype.pickObject = function(e) {
	if (E2.app.noodlesVisible === true)
		return

	if (E2.app.alt_pressed) {
		return
	}

	var isEditor = this.isActive()

	var mouseVector = new THREE.Vector3()

	var w = this.domElement.clientWidth
	var h = this.domElement.clientHeight

	var pointer = e.changedTouches ? e.changedTouches[0] : e

	var rect = this.domElement.getBoundingClientRect();
	var x = ( pointer.clientX - rect.left ) / rect.width;
	var y = ( pointer.clientY - rect.top ) / rect.height;

	mouseVector.set( ( x * 2 ) - 1, - ( y * 2 ) + 1 );

	if (this.scene && this.scene.children && this.scene.children.length > 0) {
		this.raycaster.setFromCamera(mouseVector, this.getCamera())

		var intersects = this.raycaster.intersectObjects(this.scene.children, /*recursive = */ true)
		var selectObjects = []

		for (var i = 0; i < intersects.length; i++) {
			// ancestor = object closest to object3d tree root
			var ancestorObj = undefined

			var seekObj = intersects[i].object

			// traverse the tree hierarchy up to find a parent with a node back reference
			// store a reference to the object closest to the scene root (ancestorObj)
			while (seekObj) {
				if (seekObj.backReference && seekObj !== this.scene) {
					ancestorObj = seekObj
				}

				seekObj = seekObj.parent
			}
			if (!ancestorObj) {
				// nothing found
				continue
			}

			if (ancestorObj.backReference.parentNode === this.scene.backReference.parentNode) {
				// trying to select the scene, ignore
				continue
			}

			selectObjects.push(ancestorObj)

			// select everything between the mesh and scene nodes
			// (and any complete subgraph that contains the mesh)
			this.selectMeshAndDependencies(ancestorObj.backReference.parentNode, this.scene.backReference.parentNode)

			// only select a single object
			break
		}

		if (isEditor) {
			this.setSelection(selectObjects)
		}
	}
	else if (isEditor) {
		this.setSelection([])
	}
}

WorldEditor.prototype.mouseDown = function(e) {
	if (this.isActive()) {
		this.dragContext = {startX: e.pageX, startY: e.pageY}
	}
}

WorldEditor.prototype.mouseUp = function(e) {
	if (this.dragContext && e.pageX === this.dragContext.startX && e.pageY === this.dragContext.startY) {
		// only pick an object if there was no drag
		this.pickObject(e)
	}
}

WorldEditor.prototype.setupObjectPicking = function() {
	$(document).mousedown(this.mouseDown.bind(this))
	$(document).mouseup(this.mouseUp.bind(this))
	this.raycaster = new THREE.Raycaster()
}

WorldEditor.prototype.getActiveSceneNode = function() {
	return this.scene.backReference.parentNode
}

WorldEditor.prototype.matchCamera = function() {
	// match the selected vr camera to world editor camera
	var vrCameraPlugin = this.vrCamera.backReference
	var editCamera = this.getCamera()

	E2.app.undoManager.begin()

	var tempPosition = new THREE.Vector3(vrCameraPlugin.state.position.x, vrCameraPlugin.state.position.y, vrCameraPlugin.state.position.z)
	vrCameraPlugin.undoableSetState('position', editCamera.position.clone(), tempPosition)
	var tempQuaternion = new THREE.Quaternion(vrCameraPlugin.state.quaternion._x, vrCameraPlugin.state.quaternion._y, vrCameraPlugin.state.quaternion._z, vrCameraPlugin.state.quaternion._w)
	vrCameraPlugin.undoableSetState('quaternion', editCamera.quaternion.clone(), tempQuaternion)

	E2.app.undoManager.end()
}