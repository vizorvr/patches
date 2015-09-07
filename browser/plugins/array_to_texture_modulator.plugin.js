E2.p = E2.plugins["array_to_texture_modulator"] = function(core, node)
{
	this.desc = 'Converts the supplied array to a texture.';
	
	this.input_slots = [ 
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The array to convert.', def: null },
		{ name: 'width', dt: core.datatypes.FLOAT, desc: 'The desired width of the resulting texture.', def: 0 } 
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The resulting texture.' }
	];
};

E2.p.prototype.reset = function()
{
	this.texture = new THREE.Texture();
	this.array = null;
	this.width = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.array = new Uint8Array(data);
	else
		this.width = Math.floor(data);
};	

E2.p.prototype.update_state = function()
{
	if(!this.array || !this.width)
		return;
	
	if((this.array.byteLength / 4) % this.width)
	{
		msg('ERROR: Cannot create texture. The supplied width does not divide evenly into the array size in pixels.');
		return;
	}
	
	var w = this.width;
	var h = (this.array.byteLength / 4) / this.width;
	
	if(!t.isPow2(w))
	{
		msg('WARNING: The width (' + w + ') of the texture is not a power of two.');
		return;
	}
	
	if(!t.isPow2(h))
	{
		msg('WARNING: The height (' + h + ') of the texture is not a power of two.');
		return;
	}
	
	msg('Uploading texture from array with size ' + w + 'x' + h);

	this.texture = new THREE.DataTexture(this.array, w, h)
};

E2.p.prototype.update_output = function(slot)
{
	return this.texture;
};
