E2.p = E2.plugins["typed_array_generator"] = function(core, node)
{
	this.desc = 'Create a zeroed out array of a given size (in bytes).';
	
	this.input_slots = [
		{ name: 'size', dt: core.datatypes.FLOAT, desc: 'Size if array in number of elements.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The resulting array.' }
	];

	this.state = { datatype: 1 }; // Default uint8
	
	this.size = 0;
	this.update_array();
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
		self.update_array();
		self.updated = true;
	}}(this));
	
	return inp;
};

E2.p.prototype.update_array = function()
{
	if(this.size === 0)
	{
		this.array = null;
		return;
	}
	
	var stride = [1, 1, 2, 2, 4, 4, 4][this.state.datatype]; 

	this.array = new ArrayBuffer(stride * this.size);
	this.array.datatype = this.state.datatype;
	this.array.stride = stride;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.size = Math.floor(data);
	this.update_array();
};

E2.p.prototype.update_output = function(slot)
{
	return this.array;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
		ui.val('' + this.state.datatype);
};
