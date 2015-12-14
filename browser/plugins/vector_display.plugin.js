(function() {
var VectorDisplay = E2.plugins.vector_display = function(core) {
	this.desc = 'Displays the supplied vector as a three-cell row of values.'
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The vector to be displayed.', def: core.renderer.vector_origin }
	]
	
	this.output_slots = []
}

VectorDisplay.prototype.reset = function() {
	this.vec = new THREE.Vector3(0, 0, 0)
	this.update_values()
}

VectorDisplay.prototype.create_ui = function(){
	var table = make('table')
	var row = make('tr')
	var css = { 'text-align': 'right', 'padding-left': '10px' }
	
	this.columns = [make('td'), make('td'), make('td')]

	for(var i = 0; i < 3; i++) {
		var c = this.columns[i]
		
		c.text('-')
		c.css(css)
		row.append(c)
	}
	
	table.append(row)

	return table
}

VectorDisplay.prototype.connection_changed = function(on) {
	if (!on)
		this.reset()
}

VectorDisplay.prototype.update_input = function(slot, data) {
	this.vec = data
	this.update_values()
}

VectorDisplay.prototype.update_values = function() {
	if (!this.columns)
		return
	
	this.columns[0].text(this.vec.x)
	this.columns[1].text(this.vec.y)
	this.columns[2].text(this.vec.z)
}
})()