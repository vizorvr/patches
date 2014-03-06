
function Registers(core)
{
	this.core = core;
	this.registers = {};
}

Registers.prototype.lock = function(plugin, name)
{
	if(name in this.registers)
		this.registers[name].ref_count++;
	else
		this.registers[name] = { dt: E2.app.player.core.datatypes.ANY, value: null, users: [], ref_count: 1, connections: 0 };
	
	var u = this.registers[name].users;
	
	if(!(plugin in u))
		u.push(plugin);
};

Registers.prototype.unlock = function(plugin, name)
{
	if(name in this.registers)
	{
		var reg = this.registers[name];
		
		reg.users.remove(plugin);
		
		if(--reg.ref_count === 0)
			delete this.registers[name];
	}
};

Registers.prototype.connection_changed = function(name, added)
{
	var r = this.registers[name];

	if(!added)
	{
		r.connections--;
		
		if(r.connections === 0)
		{
			var u = r.users;
			var any = E2.app.player.core.datatypes.ANY;
			
			for(var i = 0, len = u.length; i < len; i++)
				u[i].register_dt_changed(any);
		}
	}
	else
		r.connections++;
		
};

Registers.prototype.set_datatype = function(name, dt)
{
	var r = this.registers[name];
	var u = r.users;
	
	console.assert(r.dt === E2.app.player.core.datatypes.ANY);
	
	for(var i = 0, len = u.length; i < len; i++)
		u[i].register_dt_changed(dt);
	
	r.dt = dt;
	this.write(name, this.core.get_default_value(dt))
};

Registers.prototype.write = function(name, value)
{
	var r = this.registers[name];
	var u = r.users;
	
	r.value = value;
	
	for(var i = 0, len = u.length; i < len; i++)
	{
		var plg = u[i];
		
		if(plg.register_updated)
			plg.register_updated(value);
	}
};

Registers.prototype.count = function()
{
	var size = 0;
	
	for(var key in this.registers)
	{
		if(!this.registers.hasOwnProperty(key))
			size++;
	}
	
	return size;
};

Registers.prototype.serialise = function(d)
{
	var regs = this.registers;
	var dregs = [];
	
	for(id in regs)
	{
		if(!regs.hasOwnProperty(id))
			continue;
	
		dregs.push({ id: id, dt: regs[id].dt.id });
	}
	
	if(dregs.length > 0)
		d.registers = dregs;
};

Registers.prototype.deserialise = function(regs)
{
	var rdt = E2.app.player.core.resolve_dt;

	for(var i = 0, len = regs.length; i < len; i++)
	{
		var r = regs[i];
		var r_dt = rdt[r.dt];
	
		this.registers[r.id] = { dt: r_dt, value: null, users: [], ref_count: 1, connections: 0 };
		this.write(r.id, this.core.get_default_value(r_dt));
	}
};

