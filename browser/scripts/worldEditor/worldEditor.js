function WorldEditor() {
	this.domElement = E2.dom.webgl_canvas[0]
	this.camera = new WorldEditorCamera(this.domElement)

	var that = this
	var active = true

	this.activate = function() {
		active = true
	}

	this.deactivate = function() {
		if (this.activeScene && this.activeScene.children.indexOf(this.editorTree)) {
			this.activeScene.remove(this.editorTree)
		}

		active = false
	}

	this.isActive = function() {
		return active
	}

	this.editorControls = new THREE.EditorControls(this.camera.perspectiveCamera, this.camera.domElement)

	this.editorTree = new THREE.Object3D()

	// grid around origin along x, z axises
	this.grid = new WorldEditorOriginGrid()
	this.editorTree.add(this.grid.mesh)

	// root for any selection bboxes
	this.selectionTree = new THREE.Object3D()
	this.editorTree.add(this.selectionTree)

	// transform controls
	this.transformControls = new THREE.TransformControls(this.camera.perspectiveCamera, this.domElement)
}

WorldEditor.prototype.update = function() {
	if (!this.isActive()) {
		return
	}

	if (this.activeScene && this.editorTree && this.editorTree.parent !== this.activeScene) {
		if (this.editorTree.parent) {
			this.editorRoot.parent.remove(this.editorTree)
		}

		this.activeScene.add(this.editorTree)
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

WorldEditor.prototype.updateScene = function(scene) {
	this.activeScene = scene
}

WorldEditor.prototype.getEditorSceneTree = function() {
	return this.editorTree
}

WorldEditor.prototype.setSelection = function(selected) {
	this.selectionTree.children = []

	this.editorControls.enabled = selected.length === 0

	this.transformControls.detach()

	var numToSelect = selected.length ? 1 : 0

	for (var i = 0; i < numToSelect; ++i) {
		this.transformControls.attach(selected[i].object)
		this.selectionTree.add(this.transformControls)
	}
}
