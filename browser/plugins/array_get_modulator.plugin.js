E2.p = E2.plugins["array_get_modulator"] = function(core, node)
{
	this.desc = 'Gets an item value from an array.';
	
	this.input_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The array to obtain a value from.', def: null },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The index of the item to get.', def: 0 }
	];
	
	this.output_slots = [ 
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The modified array.' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The value of the chosen item.', def: 0 }
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
	else
		this.index = Math.floor(data);
};

E2.p.prototype.update_view = function()
{
	if(!this.array)
	{
		this.dv = null;
		return;
	}
	
	var dv = this.dv = new DataView(this.array);

	this.accessor = [dv.getInt8,
			 dv.getUint8,
			 dv.getInt16,
			 dv.getUint16,
			 dv.getInt32,
			 dv.getUint32,
			 dv.getFloat32][this.array.datatype].bind(dv);
};

E2.p.prototype.update_state = function()
{
	if(!this.dv)
	{
		this.value = 0;
		return;
	}
	
	var off = this.index * this.array.stride;
	
	if(off < 0 || off >= this.array.byteLength)
		return;
	
	this.value = (this.array.datatype < 2) ? this.accessor(off) : this.accessor(off, true);
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.array;
	else
		return this.value;
};
