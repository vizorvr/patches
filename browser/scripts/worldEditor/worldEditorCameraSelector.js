function WorldEditorCameraSelector(domElement) {

	var perspectiveCamera = new WorldEditorCamera(domElement)
	var orthographicCamera = new WorldEditorOrthographicCamera(domElement)

	this.axisCameras = {
		'+x': {position: new THREE.Vector3(-1, 0, 0) },
		'+y': {position: new THREE.Vector3( 0,-1, 0) },
		'+z': {position: new THREE.Vector3( 0, 0,-1) },
		'-x': {position: new THREE.Vector3( 1, 0, 0) },
		'-y': {position: new THREE.Vector3( 0, 1, 0) },
		'-z': {position: new THREE.Vector3( 0, 0, 1) }
	}

	this.cameras = {
		'perspective': {
			camera: perspectiveCamera,
			editorControls: new THREE.EditorControls(perspectiveCamera.camera, domElement),
			transformControls: new THREE.TransformControls(perspectiveCamera.camera, domElement)
		},
		'orthographic': {
			camera: orthographicCamera,
			editorControls: new THREE.EditorControls(orthographicCamera.camera, domElement),
			transformControls: new THREE.TransformControls(orthographicCamera.camera, domElement)
		}
	}

	this.currentCameraId = 'perspective'

	var that = this

	Object.keys(this.cameras).forEach( function (key, i) {
		var curCam = that.cameras[key]
		curCam.editorControls.enabled = false
		curCam.transformControls.enabled = false

		function mouseDown() {
			this.editorControls.enabled = false
			if (E2.app.alt_pressed) {
				E2.app.onCopy()
				E2.app.onPaste()
			}
		}

		function mouseUp() {
			this.editorControls.enabled = true
		}

		curCam.transformControls.addEventListener('mouseDown', mouseDown.bind(curCam))

		curCam.transformControls.addEventListener('mouseUp', mouseUp.bind(curCam))
	})

}

WorldEditorCameraSelector.prototype = {
	constructor: WorldEditorCameraSelector,

	get camera() {
		return this.cameras[this.currentCameraId].camera.camera
	},

	get editorControls() {
		return this.cameras[this.currentCameraId].editorControls
	},

	get transformControls() {
		return this.cameras[this.currentCameraId].transformControls
	},

	get selectedCamera() {
		return this.currentCameraId
	},

	selectCamera: function(id) {
		if (id === this.currentCameraId) {
			return
		}

		// disable previous camera
		var wasTransformControlEnabled = this.transformControls.enabled
		var wasEditorControlEnabled = this.editorControls.enabled

		var oldPosition = this.camera.position.clone()
		var oldRotation = this.camera.rotation.clone()
		var oldQuaternion = this.camera.quaternion.clone()
		var oldScale = this.camera.scale.clone()

		this.transformControls.enabled = false
		this.editorControls.enabled = false

		this.currentCameraId = id

		// enable next camera
		this.transformControls.enabled = wasTransformControlEnabled
		this.editorControls.enabled = wasEditorControlEnabled

		this.camera.position.copy(oldPosition)
		this.camera.rotation.copy(oldRotation)
		this.camera.quaternion.copy(oldQuaternion)
		this.camera.scale.copy(oldScale)
	},

	setView: function(id) {
		var view = this.axisCameras[id].position.clone()

		var target = this.transformControls.object
		var targetPosition = target ? target.position : new THREE.Vector3(0, 0, 0)

		view.add(targetPosition)
		this.camera.position.copy(view)
		this.camera.lookAt(targetPosition)

		if (target) {
			this.editorControls.focus(target)
		}
	},

	update: function(transformMode) {
		// needs calling on every update otherwise the transform controls draw incorrectly
		this.transformControls.setMode(transformMode)
		this.transformControls.setSpace('local')
		this.transformControls.updateTransformLock()

		this.cameras[this.currentCameraId].camera.update();
	}
}
