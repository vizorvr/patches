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
	var img_data = new Uint8Array(size);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.texture.framebuffer);
	gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, img_data);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	var xhr = new XMLHttpRequest();
	
	xhr.open('POST', this.url + '?width=' + w + '&height=' + h, false);
	xhr.setRequestHeader('Content-Type', 'application/octet-stream');
	xhr.send(img_data);
};
