(function() {
var ThreeMeshLineMaterialPlugin = E2.plugins.three_meshline_material = function(core) {
	AbstractThreeMaterialPlugin.apply(this, arguments)

	this.desc = 'THREE.js MeshLine Material'

	// Just override the input slots here
	// If we want to get the stuff from the material, then would have to concat
	this.input_slots = [ 
		{ name: 'color',		dt: core.datatypes.COLOR, def: new THREE.Color(0xffffff) },
		{ name: 'opacity',		dt: core.datatypes.FLOAT, def: 1.0 },
		{ name: 'transparent',		dt: core.datatypes.BOOL,  def: false },
		{ name: 'sizeAttenuation',	dt: core.datatypes.BOOL,  def: true },
		{ name: 'lineWidth',		dt: core.datatypes.FLOAT, def: 0.01 },
		{ name: 'near',			dt: core.datatypes.FLOAT, def: 0.01 },
		{ name: 'far',			dt: core.datatypes.FLOAT, def: 1000 },
		{ name: 'depthTest',		dt: core.datatypes.BOOL,  def: true },
		{ name: 'side',			dt: core.datatypes.FLOAT, def: THREE.DoubleSide },
		{ name: 'wireframe',		dt: core.datatypes.BOOL,  def: false }
	]
	//].concat(this.input_slots)
	
	this.output_slots = [{
		name: 'material',
		dt: core.datatypes.MATERIAL
	}]
	
	// Needed for the shader
	this.resolution = new THREE.Vector2(1, 1)

	// Get the parameters from the input_slots
	var params = {}
	this.input_slots.map(function(slot) {
		params[slot.name] = slot.def
	})
	params.resolution = this.resolution

	this.material = new THREE.MeshLineMaterial(params)
}

ThreeMeshLineMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

ThreeMeshLineMaterialPlugin.prototype.state_changed = function(ui) {
	// if ui is null, first time called, bind the resize
	if (!ui) {
		E2.core.on('resize', this.resize.bind(this))
	}
}

ThreeMeshLineMaterialPlugin.prototype.update_input = function(slot, data) {
	Plugin.prototype.update_input.apply(this, arguments)

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

