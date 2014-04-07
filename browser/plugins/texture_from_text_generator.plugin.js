E2.p = E2.plugins["texture_from_text_generator"] = function(core, node)
{
	this.desc = 'Create a texture of a (2^n closest to the) given size filled with a rendered version of the supplied text.';
	
	this.input_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The text to be rendered to <b>texture</b>.', def: '' },
		{ name: 'width', dt: core.datatypes.FLOAT, desc: 'The width of the output <b>texture</b>. Will be rounded to nearest 2^n.', lo: 2, hi: 1024, def: 128 },
		{ name: 'height', dt: core.datatypes.FLOAT, desc: 'The height of the output <b>texture</b>. Will be rounded to nearest 2^n.', lo: 2, hi: 1024, def: 128 },
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The x position of the text.', def: 10 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'The y position of the text.', def: 10 },
		{ name: 'font style', dt: core.datatypes.TEXT, desc: 'The desired font style (CSS standard).', def: 'bold 16px arial' },
		{ name: 'fill style', dt: core.datatypes.TEXT, desc: 'The desired fill style (CSS standard).', def: '#fff' },
		{ name: 'stroke style', dt: core.datatypes.TEXT, desc: 'The desired stroke style (CSS standard).', def: 'none' },
		{ name: 'stroke width', dt: core.datatypes.FLOAT, desc: 'The desired stroke width in pixels.', def: 0 },
		{ name: 'align', dt: core.datatypes.TEXT, desc: 'Text alignment.', def: 'center' },
		{ name: 'baseline', dt: core.datatypes.TEXT, desc: 'Text baseline.', def: 'middle' },
		{ name: 'line height', dt: core.datatypes.FLOAT, desc: 'Line height scalar.', def: 1.2 }
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'Output texture containing the rendered text.' }
	];
	
	this.gl = core.renderer.context;
	this.mesh = null;
	this.canvas2d = $('<canvas style="display:none" width="128" height="128"></canvas>')[0];
	this.c2d_ctx  = this.canvas2d.getContext('2d');
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.sanitize_size = function(n)
{
	var v =  Math.log(n) / Math.log(2);	
	var v_int = Math.floor(v);
	
	if(v_int < 1)
		v_int = 1;
	else if(v_int > 10)
		v_int = 10;
	
	return Math.pow(2, v_int);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.text = data;
	else if(slot.index === 1)
		this.width = this.sanitize_size(data);
	else if(slot.index === 2)
		this.height = this.sanitize_size(data);
	else if(slot.index === 3)
		this.x = data;
	else if(slot.index === 4)
		this.y = data;
	else if(slot.index === 5)
		this.font_style = data;
	else if(slot.index === 6)
		this.fill_style = data;
	else if(slot.index === 7)
		this.stroke_style = data;
	else if(slot.index === 8)
		this.stroke_width = data;
	else if(slot.index === 9)
		this.align = data;
	else if(slot.index === 10)
		this.baseline = data;
	else if(slot.index === 11)
		this.line_height = data;
};

E2.p.prototype.update_state = function()
{
	if(this.text === '')
		return;
	
	var lines = this.text.split('\n');
	var cv = this.canvas2d;
	var ctx = this.c2d_ctx;
	
	cv.width = this.width;
	cv.height = this.height;
	ctx.clearRect(0, 0, this.width, this.height);
	ctx.fillStyle = this.fill_style;
	ctx.lineWidth = this.stroke_width;
	ctx.strokeStyle = this.stroke_style;
	ctx.font = this.font_style;
	ctx.textAlign = this.align;
	ctx.textBaseline = this.baseline;
	
	var l_height = ctx.measureText('M').width * this.line_height; // This is very, very silly...
	
	for(var i = 0, len = lines.length; i < len; i++)
	{
		var y = this.y + (i * l_height);
		var line = lines[i];
		
		ctx.strokeText(line, this.x, y);
		ctx.fillText(line, this.x, y);
	}
	
	this.texture.upload(cv, 'Rendered text');
};

E2.p.prototype.update_output = function(slot)
{
	return this.texture;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.texture = new Texture(this.gl);
		this.text = '';
		this.width = 128;
		this.height = 128;
		this.x = 10;
		this.y = 10;
		this.font_style = 'bold 16px arial';
		this.fill_style = '#fff';
		this.stroke_style = 'none';
		this.stroke_width = 0;
		this.align = 'center';
		this.baseline = 'middle';
		this.line_height = 1.2;
	}
}
