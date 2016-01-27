function WorldEditor(domElement) {
	this.domElement = domElement
	this.showEditorHelpers = true
	var active = false

	this.activate = function() {
		active = true
		this.cameraSelector.transformControls.enabled = true
		this.cameraSelector.editorControls.enabled = true
		this.showEditorHelpers = true
	}

	this.deactivate = function() {
		this.cameraSelector.transformControls.enabled = false
		this.cameraSelector.editorControls.enabled = false
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
	this.gridHelper = new WorldEditorOriginGrid()
	this.editorTree.add(this.gridHelper.mesh)

	// radial grid
	this.radialHelper = new WorldEditorRadialHelper()

	// root for any selection bboxes
	this.selectionTree = new THREE.Object3D()
	this.editorTree.add(this.selectionTree)

	// root for 3d handles
	this.handleTree = new THREE.Object3D()
	this.editorTree.add(this.handleTree)

	this.cameraSelector = new WorldEditorCameraSelector(this.domElement)

	this.cameraHelper = new VRCameraHelper()

	var that = this

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

	var cameraDistanceToSelectedObject = this.cameraSelector.camera.position.clone().sub(this.cameraSelector.editorControls.center).length() || 1
	var gridScale = f(cameraDistanceToSelectedObject, 0.01)

	this.gridHelper.scale(gridScale)

	if (this.vrCamera) {
		this.radialHelper.position(this.vrCamera.position)

		var cameraDistanceToVRCamera = this.cameraSelector.camera.position.clone().sub(this.vrCamera.position).length() || 1
		var gridScale = f(cameraDistanceToVRCamera, 0.01)
		gridScale = gridScale < 1 ? 1 : gridScale
		this.radialHelper.scale(gridScale)
	}

	this.cameraSelector.update(this.transformMode)
}

WorldEditor.prototype.preRenderUpdate = function() {
	// add the editor tree to the scene if it's not there already
	var editorIdx = this.scene.children.indexOf(this.editorTree)

	if (this.showEditorHelpers && editorIdx < 0) {
		this.scene.add(this.editorTree)
	}
	else if (!this.showEditorHelpers && editorIdx >= 0) {
		this.scene.remove(this.editorTree)
	}
}

WorldEditor.prototype.getCamera = function() {
	return this.cameraSelector.camera
}

WorldEditor.prototype.updateHelperHandles = function(scene, camera) {
	var needsHandles = []
	var newHandles = []
	var removeHandles = []

	var that = this

	// 1. collect objects requiring handles
	var nodeCollector = function ( node ) {
		if (node instanceof THREE.PointLight
		||  node instanceof THREE.DirectionalLight
		||  node instanceof THREE.SpotLight
		||  node instanceof THREE.HemisphereLight) {
			needsHandles.push(node)
		}
	}

	if (scene) {
		scene.children[0].traverse( nodeCollector )
	}

	// add handles for the camera helper
	if (camera && camera.parent instanceof THREE.Camera) {
		needsHandles.push(camera.parent)
	}

	// 2. remove handles that are no longer there
	this.handleTree.traverse(function(n) {
		if (needsHandles.indexOf(n.helperObjectBackReference) === -1) {
			removeHandles.push(n)
		}
	})

	for (var i = 0; i < removeHandles.length; ++i) {
		this.handleTree.remove(removeHandles[i])
	}

	// 3. create a list of handles to be created and filter out existing handles
	newHandles = needsHandles.slice(0)

	for (var i = 0; i < this.handleTree.children.length; ++i) {
		var indexOfHandle = newHandles.indexOf(this.handleTree.children[i].helperObjectBackReference)
		if (indexOfHandle !== 1) {
			newHandles.splice(indexOfHandle, 1)
		}
	}

	// 4. finally create any new handles
	for (var i = 0; i < newHandles.length; ++i) {
		var node = newHandles[i]

		if (node instanceof THREE.PointLight) {
			var helper = new THREE.PointLightHelper(node, 0.5)

			helper.backReference = node.backReference
			helper.helperObjectBackReference = node
			this.handleTree.add(helper)
		}
		else if (node instanceof THREE.DirectionalLight) {
			var helper = new THREE.DirectionalLightHelper(node, 0.5)

			helper.backReference = node.backReference
			helper.helperObjectBackReference = node
			this.handleTree.add(helper)
		}
		else if (node instanceof THREE.SpotLight) {
			var helper = new THREE.SpotLightHelper(node)

			helper.backReference = node.backReference
			helper.helperObjectBackReference = node
			this.handleTree.add(helper)
		}
		else if (node instanceof THREE.HemisphereLight) {
			var helper = new THREE.HemisphereLightHelper(node, 0.5)

			helper.backReference = node.backReference
			helper.helperObjectBackReference = node
			this.handleTree.add(helper)
		}
		else if (node instanceof THREE.Camera) {
			this.cameraHelper.helperObjectBackReference = node
			this.cameraHelper.attachCamera(node)
			this.handleTree.add(this.cameraHelper)
		}
	}
}

WorldEditor.prototype.updateScene = function(scene, camera) {
	this.scene = scene
	this.vrCamera = camera

	this.updateHelperHandles(scene, camera)

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
			this.cameraSelector.transformControls.attach(obj)
			this.selectionTree.add(this.cameraSelector.transformControls)

			anySelected = true
			// only attach to first valid item
			break
		}
	}

	if (!anySelected) {
		this.cameraSelector.transformControls.detach()
	}
}

WorldEditor.prototype.onDelete = function(nodes) {
	this.cameraSelector.transformControls.detach()
}

WorldEditor.prototype.onPaste = function(nodes) {
	if (!nodes || nodes.length < 1) {
		return
	}

	var dropNode = nodes[0]

	// find scene node
	var sceneNode = this.currentGroup || this.scene.backReference.parentNode

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
		src_dyn: srcSlot.dynamic,
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

WorldEditor.prototype.selectMeshAndDependencies = function(meshNode, sceneNode, selectSingleObject) {
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
			if (!allOutputs[i].src_slot.is_connected || allOutputs[i].src_slot.dt !== E2.core.datatypes.OBJECT3D) {
				continue
			}

			var candidateNode = allOutputs[i].dst_node

			var atEndNode = candidateNode === endNode

			var foundRouteToEnd =
					atEndNode ||
					(candidateNode ?
							collectConnectingNodesBetween(candidateNode, endNode) :
							false)

			if (foundRouteToEnd) {
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
	this.currentGroup = undefined

	if (meshNode) {
		// step 1:
		// collect nodes between mesh and scene
		collectConnectingNodesBetween(meshNode, sceneNode)

		if (selectNodes.length === 0) {
			// found nothing
			return
		}

		// step 2:
		// if we're selecting a single object, drop anything after group
		// nodes from the selection
		if (selectSingleObject) {
			for (var i = selectNodes.length - 1; i >= 0; --i) {
				if (selectNodes[i].plugin instanceof E2.plugins.three_group) {
					this.currentGroup = selectNodes[i]
					selectNodes.splice(0, i + 1)
					break
				}
			}
		}

		// step 3:
		// add any objects hidden in group hierarchies into selection
		var resolvedMeshNode = selectNodes[selectNodes.length - 1]
		var origSelection = selectNodes.slice(0)

		for (var i = 0; i < origSelection.length; ++i) {
			var node = origSelection[i]

			if (node.plugin.object3d && node.plugin instanceof E2.plugins.three_group) {
				node.plugin.object3d.traverse(function(obj) {
					if (obj.backReference && selectNodes.indexOf(obj.backReference.node) === -1) {
						collectConnectingNodesBetween(obj.backReference.node, node)
					}
				})
			}
		}


		// go to the correct graph level for the selection
		if (selectNodes.length > 0) {
			selectNodes[0].parent_graph.tree_node.activate()
		}

		// step 4:
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

	// if alt is pressed, we try to select the single object we click
	// otherwise we select the topmost group the clicked object is in
	var selectSingleObject = E2.app.alt_pressed

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
				if (seekObj.helperObjectBackReference !== undefined) {
					// resolve back from a helper object to the object
					// the helper is for
					seekObj = seekObj.helperObjectBackReference
				}

				if (seekObj.backReference && seekObj !== this.scene) {
					ancestorObj = seekObj

					if (selectSingleObject) {
						break
					}
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

			var selectionStartNode = ancestorObj.backReference.parentNode
			var selectionEndNode = this.scene.backReference.parentNode

			// select everything between the mesh and scene nodes
			// (and any complete subgraph that contains the mesh)
			this.selectMeshAndDependencies(selectionStartNode, selectionEndNode, selectSingleObject)

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

WorldEditor.prototype.toggleGrid = function() {
	if (this.editorTree.children.indexOf(this.gridHelper.mesh) !== -1) {
		this.editorTree.remove(this.gridHelper.mesh)
		this.editorTree.add(this.radialHelper.mesh)
	}
	else {
		this.editorTree.remove(this.radialHelper.mesh)
		this.editorTree.add(this.gridHelper.mesh)
	}
}

WorldEditor.prototype.setCameraView = function(camera) {
	this.cameraSelector.setView(camera)
}

WorldEditor.prototype.toggleCameraOrthographic = function() {
	// save selected object
	var selectedObject = this.cameraSelector.transformControls.object
	if (selectedObject !== undefined) {
		this.cameraSelector.transformControls.detach()
	}

	this.cameraSelector.selectCamera(this.cameraSelector.selectedCamera === 'orthographic' ? 'perspective' : 'orthographic')

	// reselect the selection for the new camera
	if (selectedObject !== undefined) {
		this.setSelection([selectedObject])
	}
}

WorldEditor.prototype.toggleEditorHelpers = function() {
	this.showEditorHelpers = !this.showEditorHelpers
}

WorldEditor.prototype.frameSelection = function() {
	var selectedObject = this.cameraSelector.transformControls.object

	var cameraDirection = this.cameraSelector.camera.getWorldDirection()

	var center = new THREE.Vector3()
	var radius = 1

	if (selectedObject === undefined) {
		selectedObject = this.scene
	}

	if (selectedObject) {
		center.copy(selectedObject.position)
		center.applyMatrix4(selectedObject.matrixWorld)

		var tempSphere = new THREE.Sphere()

		selectedObject.traverse(function(n) {
			if (n.geometry) {
				if (!n.geometry.boundingSphere) {
					n.geometry.computeBoundingSphere()
				}

				tempSphere.copy(n.geometry.boundingSphere)
				tempSphere.applyMatrix4(n.matrixWorld)

				var nodeRadius = center.distanceTo(tempSphere.center) + tempSphere.radius
				if (radius < nodeRadius) {
					radius = nodeRadius
				}
			}
		})

		this.cameraSelector.camera.position.copy(selectedObject.position.clone().sub(cameraDirection.multiplyScalar(radius * 1.5)))

		this.cameraSelector.camera.lookAt(selectedObject.position)
		this.cameraSelector.editorControls.focus(selectedObject)
	}
}
