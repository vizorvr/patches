E2.p = E2.plugins["object_add"] = function(core, node)
{
	this.desc = 'Object composition';
	
	this.input_slots = [ 
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Optional existing object'},
		{ name: 'key', dt: core.datatypes.TEXT, desc: 'The key'},
		{ name: 'value', dt: core.datatypes.ANY, desc: 'The value: A float, text or object.'} 
	];
	
	this.output_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'The created object' }
	];

	this._object = {};
}

E2.p.prototype.reset = function()
{
	this._key = null;
	this._object = {};
}

E2.p.prototype.update_input = function(slot, data)
{
	switch(slot.index)
	{
		case 0:
			var previousValue = this._object[this._key];
			this._object = $.extend({}, data);
			if (previousValue && this._key)
			{
				this._object[this._key] = previousValue;
			}
			break;
		case 1:
			this._key = data;
			break;
		case 2:
			this._object[this._key] = data;
			break;
	}
};	

E2.p.prototype.update_output = function(slot)
{
	return this._object;
};
