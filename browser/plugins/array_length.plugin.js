var ArrayLengthPlugin = E2.plugins.array_length = function ArrayLengthPlugin(core) {
	this.input_slots = [
		{
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
			def: []
		},
	]

	this.output_slots = [ {
			name: 'length',
			dt: core.datatypes.FLOAT
		}
	]

	this.array = []
}

ArrayLengthPlugin.prototype.update_input = function(slot, data) {
	this.array = data
}

ArrayLengthPlugin.prototype.update_output = function() {
	return this.array.length
}
