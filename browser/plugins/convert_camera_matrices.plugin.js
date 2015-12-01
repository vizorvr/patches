E2.p = E2.plugins["convert_camera_matrices"] = function(core, node)
{
	this.desc = 'Extract the projection and view matrices from a camera.';
	
	this.input_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The input camera to be split into constituent matrices.' },
	]
	
	this.output_slots = [ 
		{ name: 'projection', dt: core.datatypes.MATRIX, desc: 'The camera projection matrix.' },
		{ name: 'view', dt: core.datatypes.MATRIX, desc: 'The camera view matrix.' }
	]

	this.viewMatrix = new THREE.Matrix4()
}

E2.p.prototype.reset = function()
{
	this.camera = new THREE.Camera()
}

E2.p.prototype.update_input = function(slot, data)
{
	this.camera = data
	this.camera.updateMatrixWorld()

	this.viewMatrix.copy(this.camera.matrixWorld)
	this.viewMatrix.elements[12] = 0
	this.viewMatrix.elements[13] = 0
	this.viewMatrix.elements[14] = 0

}

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.camera.projectionMatrix
	else
		return this.viewMatrix
}
