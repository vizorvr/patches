E2.p = E2.plugins["array_get_modulator"] = function(core, node)
{
	this.desc = 'Gets an item value from an array.';
	
	this.input_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The array to obtain a value from.' },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The index of the item to get.', def: 0 }
	];
	
	this.output_slots = [ 
		 { name: 'value', dt: core.datatypes.FLOAT, desc: 'The value of the chosen item.' }
	];

	this.state = { datatype: 1 }; // Default uint8

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

E2.p.prototype.create_ui = function()
{
	var inp = $('<select />', { selectedIndex: 1 });
	
	$('<option />', { value: 0, text: 'Int8' }).appendTo(inp);
	$('<option />', { value: 1, text: 'Uint8' }).appendTo(inp);
	$('<option />', { value: 2, text: 'Int16' }).appendTo(inp);
	$('<option />', { value: 3, text: 'Uint16' }).appendTo(inp);
	$('<option />', { value: 4, text: 'Int32' }).appendTo(inp);
	$('<option />', { value: 5, text: 'Uint32' }).appendTo(inp);
	$('<option />', { value: 6, text: 'Float32' }).appendTo(inp);
	
	inp.change(function(self) { return function() 
	{
		self.state.datatype = parseInt(inp.val());
		self.update_view();
		self.updated = true;
		self.node.queued_update = 1;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0 && this.array !== data)
	{
		this.array = data;
		this.update_view();
	}
	else
		this.index = Math.floor(data);
};

E2.p.prototype.update_view = function()
{
	var dv = this.dv = new DataView(this.array);

	this.accessor = [dv.getInt8,
			 dv.getUint8,
			 dv.getInt16,
			 dv.getUint16,
			 dv.getInt32,
			 dv.getUint32,
			 dv.getFloat32][this.state.datatype].bind(dv);
	this.stride = [1, 1, 2, 2, 4, 4, 4][this.state.datatype];
};

E2.p.prototype.update_state = function()
{
	if(!this.dv)
		return;

	var off = this.index * this.stride;
	
	if(off < 0 || off >= this.array.byteLength)
		return;
	
	this.value = this.accessor(off);
	msg('Getting: ' + this.value);
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.datatype);
};
