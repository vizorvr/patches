E2.p = E2.plugins["perspective_camera"] = function(core, node)
{
	this.desc = 'Create a new perspective (3D) camera.'
	
	this.input_slots = [
		{ name: 'FOV', dt: core.datatypes.FLOAT, desc: 'Field of view in degrees.', def: 45.0 },
		{ name: 'near', dt: core.datatypes.FLOAT, desc: 'Depth of the near clipping plane.', def: 0.01 },
		{ name: 'far', dt: core.datatypes.FLOAT, desc: 'Depth of the far clipping plane.', def: 1000.0 },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Camera position.', def: [0,0,2] },
		{ name: 'rotation', dt: core.datatypes.VECTOR, desc: 'Camera rotation.', def: [0,0,0] },
		{ name: 'aspect ratio', dt: core.datatypes.FLOAT, desc: 'Aspect Ratio'}
	]
	
	this.output_slots = [
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.' }
	]
}

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0) // fov
		this.camera.fov = data
	else if(slot.index === 1) // near
		this.camera.near = data
	else if(slot.index === 2) // far
		this.camera.far = data
	else if(slot.index === 3) // position
		this.camera.position.set(data.x, data.y, data.z)
	else if(slot.index === 4) // rotation
		this.camera.rotation.set(data.x, data.y, data.z)
	else if(slot.index === 5) // aspect ratio
		this.camera.aspectRatio = data

	this.camera.updateProjectionMatrix()
}

E2.p.prototype.update_state = function()
{
}

E2.p.prototype.update_output = function(slot)
{
	return this.camera
}

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.camera = new THREE.PerspectiveCamera(45.0, 1.0, 0.1, 100.0)
		this.camera.position.set(0.0, 0.0, -2.0)
		this.camera.rotation.set(0.0, 0.0, 0.0)
	}
}
