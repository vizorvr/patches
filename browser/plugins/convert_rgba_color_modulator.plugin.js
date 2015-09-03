(function() {

	ConvertRGBAColorModulator = E2.plugins.convert_rgba_color_modulator = function(core) {
		this.desc = 'Creates a new color from individual RGBA components.'
		
		this.input_slots = [
			 { name: 'red', dt: core.datatypes.FLOAT, desc: 'Red channel value.', lo: 0, hi: 1, def: 1.0 },
			 { name: 'green', dt: core.datatypes.FLOAT, desc: 'Green channel value.', lo: 0, hi: 1, def: 1.0 },
			 { name: 'blue', dt: core.datatypes.FLOAT, desc: 'Blue channel value.', lo: 0, hi: 1, def: 1.0 },
			 { name: 'alpha', dt: core.datatypes.FLOAT, desc: 'Alpha channel value.', lo: 0, hi: 1, def: 1.0 }
		]
		
		this.output_slots = [ 
			{ name: 'color', dt: core.datatypes.COLOR, desc: 'The output color', def: new THREE.Color('0xffffff') } 
		]
	}

	ConvertRGBAColorModulator.prototype.reset = function() {
		this.color = new THREE.Color('0xffffff')
	}

	ConvertRGBAColorModulator.prototype.update_input = function(slot, data) {
		if (slot.index === 0)
			this.color.setR(data)
		if (slot.index === 1)
			this.color.setG(data)
		if (slot.index === 2)
			this.color.setB(data)
	}

	ConvertRGBAColorModulator.prototype.update_output = function() {
		return this.color
	}

})()