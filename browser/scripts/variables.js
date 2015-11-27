(function() {

function Variables(core) {
	this.core = core
	this.variables = {}
}

Variables.prototype.lock = function(plugin, name, connections) {
	if (name in this.variables) {
		this.variables[name].ref_count++
		if (connections > 0)
			this.variables[name].connections += connections
	} else {
		this.variables[name] = {
			dt: E2.dt.ANY,
			value: null,
			users: [],
			ref_count: 1,
			connections: 0
		}
	}
	
	var u = this.variables[name].users
	
	if (!(plugin in u))
		u.push(plugin)
}

Variables.prototype.unlock = function(plugin, name) {
	if (name in this.variables) {
		var reg = this.variables[name]

		reg.users.splice(reg.users.indexOf(plugin), 1)

		if(--reg.ref_count === 0)
			delete this.variables[name]
	}
}

Variables.prototype.connection_changed = function(name, added) {
	var r = this.variables[name]

	if (!added) {
		r.connections--
		
		if (r.connections <= 0) {
			r.connections = 0
			this.set_datatype(name, E2.dt.ANY, false)
		}
	}
	else
		r.connections++
		
	return r.connections
}

Variables.prototype.set_datatype = function(name, dt, arrayness) {
	var r = this.variables[name]
	var u = r.users
	
	for(var i = 0, len = u.length; i < len; i++)
		u[i].variable_dt_changed(dt, arrayness)
	
	r.dt = dt
	r.array = arrayness

	this.write(name, this.core.get_default_value(dt))
}

Variables.prototype.read = function(name) {
	return this.variables[name].value
}

Variables.prototype.write = function(name, value) {
	var r = this.variables[name]
	var u = r.users
	
	r.value = value
	
	for(var i = 0, len = u.length; i < len; i++) {
		var plg = u[i]
		
		if(plg.variable_updated)
			plg.variable_updated(value)
	}
}

Variables.prototype.count = function() {
	var size = 0
	
	for(var key in this.variables) {
		if (!this.variables.hasOwnProperty(key))
			size++
	}
	
	return size
}

Variables.prototype.serialise = function(d) {
	var regs = this.variables
	var dregs = []
	
	for(id in regs) {
		if (!regs.hasOwnProperty(id))
			continue
	
		dregs.push({
			id: id,
			dt: regs[id].dt.id,
			array: regs[id].array
		})
	}

	if(dregs.length > 0)
		d.variables = dregs
}

Variables.prototype.deserialise = function(regs) {
	var rdt = E2.app.player.core.resolve_dt

	for(var i = 0, len = regs.length; i < len; i++) {
		var r = regs[i]
		var r_dt = rdt[r.dt]
	
		this.variables[r.id] = {
			dt: r_dt,
			array: r.array,
			value: null,
			users: [],
			connections: 0,
			ref_count: 0
		}

		this.write(r.id, this.core.get_default_value(r_dt))
	}
}

E2.Variables = Variables

if (typeof(module) !== 'undefined') {
	module.exports.Variables = Variables
}

})()