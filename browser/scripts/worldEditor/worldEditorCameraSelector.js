function WorldEditorCameraSelector(domElement) {

	var perspectiveCamera = new WorldEditorCamera(domElement)
	var orthographicCamera = new WorldEditorOrthographicCamera(domElement)
	var vrCamera = new WorldEditorCamera(domElement)
	vrCamera.camera.matrixAutoUpdate = false

	this.axisCameras = {
		'+x': {position: new THREE.Vector3(-1, 0, 0) },
		'+y': {position: new THREE.Vector3( 0,-1, 0) },
		'+z': {position: new THREE.Vector3( 0, 0,-1) },
		'-x': {position: new THREE.Vector3( 1, 0, 0) },
		'-y': {position: new THREE.Vector3( 0, 1, 0) },
		'-z': {position: new THREE.Vector3( 0, 0, 1) }
	}

	orthographicCamera.pos

	var dummyEditorControls = {
		center: new THREE.Vector3(),
		enable: true
	}

	this.cameraCategories = {
		'birdsEye': [
			{
				camera: perspectiveCamera,
				editorControls: new THREE.EditorControls(perspectiveCamera.camera, domElement),
				transformControls: new THREE.TransformControls(perspectiveCamera.camera, domElement),
				canSwitchToPrimaryAxis: true
			},
			{
				camera: orthographicCamera,
				editorControls: new THREE.EditorControls(orthographicCamera.camera, domElement),
				transformControls: new THREE.TransformControls(orthographicCamera.camera, domElement),
				canSwitchToPrimaryAxis: true
			}
		],
		'vr': [
			{
				camera: vrCamera,
				editorControls: dummyEditorControls,
				transformControls: new THREE.TransformControls(vrCamera.camera, domElement),
				canSwitchToPrimaryAxis: false
			}
		]}

	this.cameras = {
		'birdsEye': this.cameraCategories.birdsEye[0],
		'vr': this.cameraCategories.vr[0]
	}

	this.currentCameraId = 'birdsEye'

	function initialiseCamera(camera) {
		camera.editorControls.enabled = false
		camera.transformControls.enabled = false

		function mouseDown() {
			this.editorControls.enabled = false
			if (E2.ui.flags.pressedAlt) {
				var doc = E2.app.serialiseSelection()
				E2.app.onPaste(doc)
			}
		}

		function mouseUp() {
			this.editorControls.enabled = true
		}

		camera.transformControls.addEventListener('mouseDown', mouseDown.bind(camera))

		camera.transformControls.addEventListener('mouseUp', mouseUp.bind(camera))
	}

	this.cameraCategories.birdsEye.map(initialiseCamera)
	this.cameraCategories.vr.map(initialiseCamera)

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

	saveCameraState: function(camera) {
		return {
			'position': camera.position.clone(),
			'rotation': camera.rotation.clone(),
			'quaternion': camera.quaternion.clone(),
			'scale': camera.scale.clone(),

			'transformControlsEnabled': this.transformControls.enabled,
			'editorControlsEnabled': this.editorControls.enabled
		}
	},

	applySavedState: function(state) {
		this.transformControls.enabled = state.transformControlsEnabled
		this.editorControls.enabled = state.editorControlsEnabled

		this.camera.position.copy(state.position)
		this.camera.rotation.copy(state.rotation)
		this.camera.quaternion.copy(state.quaternion)
		this.camera.scale.copy(state.scale)
	},

	selectCamera: function(id) {
		if (id === this.currentCameraId) {
			return
		}

		// save camera position, orientation etc
		var oldCameraState = this.saveCameraState(this.camera)

		// disable previous camera
		this.transformControls.enabled = false
		this.editorControls.enabled = false

		this.currentCameraId = id

		// apply saved state
		this.applySavedState(oldCameraState)
	},

	selectNextCameraInCurrentCategory: function() {
		var curCam = this.cameras[this.currentCameraId]
		var camCat = this.cameraCategories[this.currentCameraId]

		for (var i = 0; i < camCat.length; ++i) {
			if (curCam === camCat[i]) {
				curCam = camCat[(i+1) % camCat.length]

				break
			}
		}

		// save camera position, orientation etc
		var oldCameraState = this.saveCameraState(this.camera)

		// disable previous camera
		this.transformControls.enabled = false
		this.editorControls.enabled = false

		this.cameras[this.currentCameraId] = curCam

		// apply saved state
		this.applySavedState(oldCameraState)
	},

	setView: function(id) {
		if (!this.cameras[this.currentCameraId].canSwitchToPrimaryAxis) {
			return
		}

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

	update: function(transformMode, vrCamera) {
		// needs calling on every update otherwise the transform controls draw incorrectly
		this.transformControls.setMode(transformMode)
		this.transformControls.setSpace('local')
		this.transformControls.updateTransformLock()

		this.cameras[this.currentCameraId].camera.update();

		if (vrCamera && this.currentCameraId === 'vr') {
			// keep the editor vr camera in sync with the current vr camera plugin
			vrCamera.updateMatrixWorld()
			this.cameras.vr.camera.camera.matrixWorld.copy(vrCamera.matrixWorld)
		}
	}
}
