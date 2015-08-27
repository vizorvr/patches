function AbstractThreeMaterialPlugin(core) {
	Plugin.apply(this, arguments)

	this.input_slots = [
		{	name: 'opacity', dt: core.datatypes.FLOAT, def: 1.0,
			desc: 'Float in the range of 0.0 - 1.0 indicating how transparent the material is. A value of 0.0 indicates fully transparent, 1.0 is fully opaque. If transparent is not set to true for the material, the material will remain fully opaque and this value will only affect its color.'
		},
		{	name: 'transparent', dt: core.datatypes.BOOL, def: false,
			desc: 'Defines whether this material is transparent. When set to true, the extent to which the material is transparent is controlled by setting opacity.'
		},
		{	name: 'blending', dt: core.datatypes.FLOAT, def: 1.0,
			desc: 'Which blending to use when displaying objects with this material. Default is Normal. ' +
				'0 = No, 1 = Normal, 2 = Additive, 3 = Subtractive, 4 = Multiply, 5 = Custom'
		},
		{	name: 'side', dt: core.datatypes.FLOAT,
			def: 0,
			desc: 'Defines which of the face sides will be rendered - front, back or both. ' +
				'0 = Front, 1 = Back, 2 = Double Sided'
		},
	]

	this.output_slots = [
		{ name:'material', dt: core.datatypes.MATERIAL }
	]
}

AbstractThreeMaterialPlugin.prototype = Object.create(Plugin.prototype)

AbstractThreeMaterialPlugin.prototype.update_output = function() {
	return this.material
}

AbstractThreeMaterialPlugin.prototype.update_input = function(slot, data) {
	if (slot.name === 'texture')
		this.material.map = data
	else
		this.material[slot.name] = data

	this.material.needsUpdate = true
}

