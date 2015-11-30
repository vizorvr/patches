E2.p = E2.plugins["vector_to_screenspace"] = function(core, node)
{
	this.desc = 'Transform a vector from world to screenspace given a specified camera.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector (in worldspace) to transform.' },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'Camera to use for transformation.' }
	]
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the transformed input vector.' }
	]
}

E2.p.prototype.update_input = function(slot, data) {
	if (slot.index === 0)
		this.vector = data
	else if (slot.index === 1)
		this.camera = data
}

E2.p.prototype.update_state = function() {
	this.camera.updateMatrixWorld()
	this.camera.updateProjectionMatrix()

	var m = new THREE.Matrix4()
	this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld)
	m.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)

	this.transformed.copy(this.vector)

	this.transformed.applyMatrix4(m)
}

E2.p.prototype.update_output = function(slot)
{
	return this.transformed
}

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = new THREE.Vector3()
		this.transformed = new THREE.Vector3()
		this.camera = new THREE.Camera()
	}
}
