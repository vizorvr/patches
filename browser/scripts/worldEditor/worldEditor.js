function WorldEditor() {
	this.domElement = E2.dom.webgl_canvas[0]
	this.camera = new WorldEditorCamera(this.domElement)

	var active = false

	this.activate = function() {
		active = true
	}

	this.deactivate = function() {
		if (this.editorTree.parent) {
			this.editorTree.parent.remove(this.editorTree)
		}
		active = false
	}

	this.isActive = function() {
		return active
	}

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

	var that = this

	this.transformControls.addEventListener('mouseDown', function() {
		that.editorControls.enabled = false
	})

	this.transformControls.addEventListener('mouseUp', function() {
		that.editorControls.enabled = true
	})
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

	// modes: 'translate'/'rotate'/'scale'
	if (!E2.app.shift_pressed && E2.app.ctrl_pressed) {
		this.transformControls.setMode('rotate')
		this.transformControls.setSpace('local')
	}

	if (E2.app.shift_pressed && E2.app.ctrl_pressed) {
		this.transformControls.setMode('scale')
		this.transformControls.setSpace('local')
	}

	if (!E2.app.shift_pressed && !E2.app.ctrl_pressed) {
		this.transformControls.setMode('translate')
		this.transformControls.setSpace('local')
	}
}

WorldEditor.prototype.getCamera = function() {
	return this.camera.perspectiveCamera
}

WorldEditor.prototype.updateScene = function(scene, camera) {
	this.handleTree.children = []

	var that = this

	var nodeHandler = function ( node ) {
		if (node instanceof THREE.PointLight) {
			var cameraHelper = new THREE.PointLightHelper(node, 0.5)

			cameraHelper.backReference = node.backReference
			that.handleTree.add(cameraHelper)
		}
		else if (node instanceof THREE.DirectionalLight) {
			var cameraHelper = new THREE.DirectionalLightHelper(node, 0.5)

			cameraHelper.backReference = node.backReference
			that.handleTree.add(cameraHelper)
		}
	}

	// add handles for anything requiring them in the scene
	scene.children[0].traverse( nodeHandler )
}

WorldEditor.prototype.getEditorSceneTree = function() {
	return this.editorTree
}

WorldEditor.prototype.setSelection = function(selected) {
	this.selectionTree.children = []

	this.transformControls.detach()

	for (var i = 0; i < selected.length; ++i) {
		var obj = selected[i].object
		if (obj.backReference !== undefined) {
			this.transformControls.attach(obj)
			this.selectionTree.add(this.transformControls)

			// only attach to first valid item
			break
		}
	}
}
