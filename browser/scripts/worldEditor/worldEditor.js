function WorldEditor() {
	this.domElement = E2.dom.webgl_canvas[0]
	this.camera = new WorldEditorCamera(this.domElement)

	var active = true

	this.activate = function() {
		active = true
	}

	this.deactivate = function() {
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
	}

	if (E2.app.shift_pressed && E2.app.ctrl_pressed) {
		this.transformControls.setMode('scale')
	}

	if (!E2.app.shift_pressed && !E2.app.ctrl_pressed) {
		this.transformControls.setMode('translate')
	}
}

WorldEditor.prototype.getCamera = function() {
	return this.camera.perspectiveCamera
}

WorldEditor.prototype.updateScene = function(scene) {

}

WorldEditor.prototype.getEditorSceneTree = function() {
	return this.editorTree
}

WorldEditor.prototype.setSelection = function(selected) {
	this.selectionTree.children = []

	this.editorControls.enabled = selected.length == 0

	this.transformControls.detach()

	var numToSelect = selected.length ? 1 : 0

	for (var i = 0; i < numToSelect; ++i) {
		this.transformControls.attach(selected[i].object)
		this.selectionTree.add(this.transformControls)
	}
}
