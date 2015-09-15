(function() {
var ArrayFunctionPlugin = E2.plugins.array_function = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Creates an array with the nested patch. '+
		'A local variable called <b>index<\/b> is available to the patch in each iteration. '+
		'Each iteration should output its result to the <b>item<\/b> local variable. '

	this.input_slots = [
		{ 	name: 'length', 
			dt: core.datatypes.FLOAT, 
			desc: 'The length of the array to create.', 
			def: 0 
		}
	]

	this.output_slots = [
		{ 	name: 'array',
			array: true, 
			dt: core.datatypes.ANY, 
			desc: 'The array created by the function.',
			def: 0 },
	]

	this.state = { input_sids: {}, output_sids: {}, always_update: false }
}

ArrayFunctionPlugin.prototype = Object.create(SubGraphPlugin.prototype)

ArrayFunctionPlugin.prototype.create_ui = function() {
	var ui = make('div')
	var inp_edit = makeButton('Edit', 'Open this loop for editing.')

	inp_edit.click(function() {
		if (this.graph)
			this.graph.tree_node.activate()
	}.bind(this))

	ui.css('text-align', 'center')
	ui.append(inp_edit)

	return ui
}

ArrayFunctionPlugin.prototype.update_input = function(slot, data) {
	if (!slot.dynamic) {
		if (slot.name === 'length')
			this.length = Math.floor(data)
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
}

ArrayFunctionPlugin.prototype.update_state = function() {
	this.updated = false
	this.updated_sids.length = 0

	if (!this.graph)
		return;

	var updated = false
	this.array = []

	for(var cnt = 0; cnt < this.length; cnt ++) {
		this.graph.variables.write('index', cnt)
		this.graph.reset()

		if (this.graph.update()) {
			updated = true
		}

		var item = this.graph.variables.read('item')
		this.array[cnt] = item
	}

	this.updated = true

	if (updated && this === E2.app.player.core.active_graph)
		E2.app.updateCanvas(false)
}

ArrayFunctionPlugin.prototype.variable_dt_changed = function(dt) {
	this.output_slots[0].dt = dt
	this.updated = true
}

ArrayFunctionPlugin.prototype.update_output = function(slot) {
	if (slot.name === 'array') {
		return this.array
	}

	return SubGraphPlugin.prototype.update_output.apply(this, arguments)
}

ArrayFunctionPlugin.prototype.state_changed = function(ui) {
	var core = this.core
	var node = this.parent_node

	if (ui) {
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph arrayfunction')

		return
	}

	this.setupProxies()

	this.length = 0
	this.array = []

	this.graph.variables.lock(this, 'index')
	this.graph.variables.set_datatype('index', core.datatypes.FLOAT)

	this.graph.variables.lock(this, 'item')
	var vdt = this.graph.variables.variables.item.dt
	if (vdt.id !== E2.dt.ANY.id)
		this.graph.variables.set_datatype('item', vdt)

}

})()
