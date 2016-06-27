(function() {
var Spawner = E2.plugins.spawner = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = ''

	this.input_slots = [{
		name: 'trigger', 
		dt: core.datatypes.BOOL, 
		desc: 'Create a new instance of the patch.', 
		def: 0 
	}]

	this.output_slots = [{
		name: 'item',
		dt: core.datatypes.ANY, 
		desc: 'The thing spawned by the spawner.',
		def: 0
	},
	{
		name: 'array',
		array: true, 
		dt: core.datatypes.ANY, 
		desc: 'Everything spawned by the spawner.',
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

Spawner.prototype = Object.create(SubGraphPlugin.prototype)
Spawner.prototype.constructor = Spawner

Spawner.prototype.drilldown = function() {
	return NodeUI.drilldown(this);
}

Spawner.prototype.update_input = function(slot, data) {
	if (!slot.dynamic) {
		if (slot.name === 'trigger' && data === true)
			this.spawn()
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
}

Spawner.prototype.update_state = function(updateContext) {
	this.updated = false
	this.updated_sids.length = 0

	this.updated = true

	if (!this.graph)
		return;

	var updated = false

	this.array.length = this.graph.copies.length

	for(var i = 0; i < this.graph.copies.length; i++) {
		if (this.graph.copies[i].update(updateContext))
			updated = true

		this.array[i] = this.graph.copies[i].variables.read('item')
	}

	// console.log('update', this.array.length, this.array)

	this.updated = true

	if (updated && this === E2.app.player.core.active_graph)
		E2.app.updateCanvas(false)
}

Spawner.prototype.variable_dt_changed = function(dt) {
	this.output_slots[0].dt = dt
	this.output_slots[1].dt = dt
	this.updated = true
}

Spawner.prototype.update_output = function(slot) {
	if (slot.name === 'array')
		return this.array
}

Spawner.prototype.spawn = function() {
	var i = this.graph.copies.length 
	console.log('spawn', i)
	var graph = this.graph.makeCopy(i)
	// graph.variables.lock(this, 'item')
	graph.variables.set_datatype('index', E2.core.datatypes.FLOAT)
	graph.variables.write('index', i)
	this.updated = true
}

Spawner.prototype.state_changed = function(ui) {
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

