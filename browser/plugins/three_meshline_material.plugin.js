(function() {
var ThreeMeshLineMaterialPlugin = E2.plugins.three_meshline_material = function(core) {
	AbstractThreeMaterialPlugin.apply(this, arguments)

	this.desc = 'THREE.js MeshLine Material'
	this.material = null
	this.resolution = new THREE.Vector2(1, 1)

	// MeshLine params, used to create the material
	this.params = {
		color: new THREE.Color(0xffffff),
		opacity: 1.0,
		transparent: false,
		resolution: this.resolution,
		sizeAttenuation: true,
		lineWidth: 0.01,
		near: 0.01,
		far: 1000,
		depthTest: true,
		blending: THREE.AdditiveBlending,
		side: THREE.DoubleSide,
		wireframe: false
	}

	// Just override the input slots here
	// If we want to get the stuff from the material, then would have to concat
	this.input_slots = [ 
		{ name: 'color',		dt: core.datatypes.COLOR, def: this.params.color },
		{ name: 'opacity',		dt: core.datatypes.FLOAT, def: this.params.opacity },
		{ name: 'transparent',		dt: core.datatypes.BOOL,  def: this.params.transparent },
		{ name: 'sizeAttenuation',	dt: core.datatypes.BOOL,  def: this.params.sizeAttenuation },
		{ name: 'lineWidth',		dt: core.datatypes.FLOAT, def: this.params.lineWidth },
		{ name: 'near',			dt: core.datatypes.FLOAT, def: this.params.near },
		{ name: 'far',			dt: core.datatypes.FLOAT, def: this.params.far },
		{ name: 'depthTest',		dt: core.datatypes.BOOL,  def: this.params.depthTest },
		{ name: 'side',			dt: core.datatypes.FLOAT, def: this.params.side },
		{ name: 'wireframe',		dt: core.datatypes.BOOL,  def: this.params.wireframe }
	]

	//].concat(this.input_slots)
	this.output_slots = [{
		name: 'material',
		dt: core.datatypes.MATERIAL
	}]
}

ThreeMeshLineMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

ThreeMeshLineMaterialPlugin.prototype.reset = function() {
	AbstractThreeMaterialPlugin.prototype.reset.call(this)
	this.material = new THREE.MeshLineMaterial(this.params)
	this.resize()
}

ThreeMeshLineMaterialPlugin.prototype.state_changed = function(ui) {
	E2.core.on('resize', this.resize.bind(this))
}

ThreeMeshLineMaterialPlugin.prototype.update_input = function(slot, data) {
	// Need to update the params also, used to recreate the material
	this.params[slot.name] = data

	if ( slot.name === 'transparent' 
	  || slot.name === 'wireframe' 
	  || slot.name === 'side') {
		// Use the abstract material update method
		AbstractThreeMaterialPlugin.prototype.update_input.apply(this, arguments)
	} else {
		// Just update the shader directly
		this.material.uniforms[slot.name].value = data
	}
}

ThreeMeshLineMaterialPlugin.prototype.resize = function() {
	var canvasArea = E2.app.calculateCanvasArea()
	// Need to recalculate the resolution for sizeAttenuation
	this.resolution.set(canvasArea.width, canvasArea.height)
	this.material.uniforms.resolution.value = this.resolution
}

})()

