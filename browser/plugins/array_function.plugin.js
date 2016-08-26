(function() {
var ArrayFunctionPlugin = E2.plugins.array_function = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Creates an array with the nested patch. '+
		'A local variable called <b>index<\/b> is available to the patch in each iteration. '+
		'Each iteration should output its result to the <b>item<\/b> local variable. '

	this.input_slots = [{
		name: 'length', 
		dt: core.datatypes.FLOAT, 
		desc: 'The length of the array to create.', 
		def: 0 
	}]

	this.output_slots = [{
		name: 'array',
		array: true, 
		dt: core.datatypes.ANY, 
		desc: 'The array created by the function.',
		def: 0
	}]

	this.state = {
		input_sids: {},
		output_sids: {},
		always_update: true
	}

	this.always_update = true
	
	this.array = []
}

ArrayFunctionPlugin.prototype = Object.create(SubGraphPlugin.prototype)
ArrayFunctionPlugin.prototype.constructor = ArrayFunctionPlugin

ArrayFunctionPlugin.prototype.drilldown = function() {
	return NodeUI.drilldown(this);
}

ArrayFunctionPlugin.prototype.update_input = function(slot, data) {
	if (!slot.dynamic) {
		if (slot.name === 'length') {
			this.length = Math.floor(data)
			this.array.length = this.length
			this.refreshGraph()
		}
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
}

ArrayFunctionPlugin.prototype.update_state = function(updateContext) {
	this.updated = false
	this.updated_sids.length = 0

	if (!this.graph)
		return;

	var updated = false
	this.array = []

	for(var i = 0; i < this.length; i++) {
		if (this.graph.copies[i].update(updateContext))
			updated = true

		this.array[i] = this.graph.copies[i].variables.read('item')
	}

	this.updated = true

	this.lastUpdateContext = updateContext

	if (updated && this === E2.app.player.core.active_graph)
		E2.app.updateCanvas(false)
}

ArrayFunctionPlugin.prototype.variable_dt_changed = function(dt) {
	this.output_slots[0].dt = dt
	this.updated = true
}

ArrayFunctionPlugin.prototype.update_output = function(slot) {
	return this.array
}

ArrayFunctionPlugin.prototype.refreshGraph = function() {
	if (!this.length)
		return this.graph.clearCopies()

	while(this.graph.copies.length < this.length) {
		var graph = this.graph.makeCopy()
		graph.variables.set_datatype('index', E2.core.datatypes.FLOAT)
		graph.variables.write('index', this.graph.copies.length)
	
		// update graph once, for it to be immediately usable in the array
		if (this.lastUpdateContext)
			graph.update(this.lastUpdateContext)
	}

	while(this.graph.copies.length > this.length) {
		var last = this.graph.copies.length - 1
		this.graph.copies[last].destroy()
		this.graph.copies.splice(last, 1)
	}
}

ArrayFunctionPlugin.prototype.state_changed = function(ui) {
	var core = this.core
	var node = this.parent_node

	if (ui)
		return

	this.setupProxies()

	this.length = 0
	this.array = []

	this.graph.variables.lock(this, 'item')
	this.graph.variables.lock(this, 'index')

	this.graph.variables.set_datatype('index', E2.core.datatypes.FLOAT)

	var vdt = this.graph.variables.variables.item.dt
	if (vdt.id !== E2.dt.ANY.id)
		this.graph.variables.set_datatype('item', vdt)
}

})()

