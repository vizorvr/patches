(function(){
	
	var VectorPlugin = E2.plugins.vector = function(core) {
		this.desc = 'Create a vector from individual X, Y and Z components.'
		
		this.input_slots = [ 
			{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The input x-component.', def: 0.0 },
			{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The input y-component.', def: 0.0 },
			{ name: 'z', dt: core.datatypes.FLOAT, desc: 'The input z-component.', def: 0.0 }
		]
		
		this.output_slots = [{
				name: 'vector',
				dt: core.datatypes.VECTOR,
				desc: 'The resulting vector.',
				def: new THREE.Vector3(0,0,0)
			}
		]
	}

	VectorPlugin.prototype.reset = function() {
		this.xyz = new THREE.Vector3(0,0,0)
	}

	VectorPlugin.prototype.update_input = function(slot, data) {
		if (slot.index === 0)
			this.xyz.setX(data)
		else if (slot.index === 1)
			this.xyz.setY(data)
		else
			this.xyz.setZ(data)
	}

	VectorPlugin.prototype.update_output = function() {
		return this.xyz
	}

	VectorPlugin.prototype.state_changed = function() {}

})()
