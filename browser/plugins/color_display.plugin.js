E2.p = E2.plugins["color_display"] = function(core, node)
{
	this.desc = 'Displays the supplied color in a rectangle on the plugin.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color to be displayed.', def: core.renderer.color_white }
	];
	
	this.output_slots = [];
};

E2.p.prototype.reset = function()
{
	this.color = vec4.createFrom(1, 1, 1, 1);
};

E2.p.prototype.css = function()
{
	var obj = {}
	var c = this.color;
	
	obj['background-color'] = 'rgb(' + Math.round(c[0] * 255.0) + ', ' + Math.round(c[1] * 255.0) + ', ' + Math.round(c[2] * 255.0) + ')';
	obj['opacity'] = '' + c[3];
	
	return obj;
};

E2.p.prototype.create_ui = function()
{
	var bg = make('span');
	this.label = make('span');

	bg.css({ 'background': 'url(\'images/checkerboard.png\')', 'border': '1px #aaa solid' });
	this.label.html('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') 
	this.label.css(this.css());
	
	bg.append(this.label);
	return bg;
};

E2.p.prototype.update_input = function(slot, data)
{
	var c = this.color;
	
	c[0] = data[0];
	c[1] = data[1];
	c[2] = data[2];
	c[3] = data[3];

	if(this.label)
		this.label.css(this.css());
};
