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
				def: [0.0, 0.0, 0.0]
			}
		]
	}

	VectorPlugin.prototype.update_input = function(slot, data) {
		this.xyz[slot.index] = data
	}	

	VectorPlugin.prototype.update_output = function() {
		return this.xyz
	}

	VectorPlugin.prototype.state_changed = function(ui) {
		if (!ui)
			this.xyz = [0.0, 0.0, 0.0]
	}

})()
