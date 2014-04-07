E2.p = E2.plugins["array_set_modulator"] = function(core, node)
{
	this.desc = 'Sets an item value in an array.';
	
	this.input_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The array to set a value in.', def: null },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The index of the item to set.', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The value to set the item to.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The modified array.' }
	];
	
	this.node = node;
	this.reset();
};

E2.p.prototype.reset = function()
{
	this.array = null;
	this.dv = null;
	this.accessor = null;
	this.index = 0;
	this.value = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(this.array !== data)
		{
			this.array = data;
			this.update_view();
		}
	}
	else if(slot.index === 1)
		this.index = Math.floor(data);
	else if(slot.index === 2)
		this.value = data;
};

E2.p.prototype.update_view = function()
{
	if(!this.array)
	{
		this.dv = null;
		return;
	}
	
	var dv = this.dv = new DataView(this.array);

	this.accessor = [dv.setInt8, 
			 dv.setUint8,
			 dv.setInt16,
			 dv.setUint16,
			 dv.setInt32,
			 dv.setUint32,
			 dv.setFloat32][this.array.datatype].bind(dv);
};

E2.p.prototype.update_state = function()
{
	if(!this.dv)
		return;
	
	var off = this.index * this.array.stride;
	
	if(off < 0 || off >= this.array.byteLength)
		return;
	
	var dt = this.array.datatype;
	
	if(dt < 2)
		this.accessor(off, Math.floor(this.value));
	else
		this.accessor(off, dt === 6 ? this.value : Math.floor(this.value), true);
};

E2.p.prototype.update_output = function(slot)
{
	return this.array;
}
