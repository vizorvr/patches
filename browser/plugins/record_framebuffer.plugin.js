E2.p = E2.plugins["record_framebuffer"] = function(core, node)
{
	this.desc = 'Grab the current framebuffer and transmit frame size and RGB data to a specified recording server.';
	
	this.input_slots = [ 
		{ name: 'record', dt: core.datatypes.BOOL, desc: 'Switch recording on or off.', def: false },
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The texture output of a graph.', def: null }
	];
	
	this.output_slots = [];
	
	this.gl = core.renderer.context;
	this.url = 'http://' + window.location.host + '/fd/frame';
};

E2.p.prototype.reset = function()
{
	this.texture = null;
	this.img_data = null;
	this.conv_data = null;
	this.xhr = null;
}

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.record = data;
	else if(slot.index === 1)
		this.texture = data;
};

E2.p.prototype.update_state = function()
{
	if(!this.record || !this.url || !this.texture || !this.texture.framebuffer)
		return;
	
	var gl = this.gl;
	var w = this.texture.width;
	var h = this.texture.height;
	var size = w * h * 4;
	
	if(!this.img_data || this.img_data.byteLength !== size)
	{
		this.img_data = new Uint8Array(size);
		this.conv_data = new Uint8Array(w * h * 3);
		this.xhr = new XMLHttpRequest();
	}
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.texture.framebuffer);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, this.img_data);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var id = this.img_data;
	var cd = this.conv_data;
	
	for(var i = 0, o = 0; i < w * h * 3; i += 3, o += 4)
	{
		cd[i+2] = id[o];
		cd[i+1] = id[o+1];
		cd[i] = id[o+2];
	}
	
	this.xhr.open('POST', this.url + '?width=' + w + '&height=' + h, false);
	this.xhr.setRequestHeader('Content-Type', 'application/octet-stream');
	this.xhr.send(this.conv_data);
};
