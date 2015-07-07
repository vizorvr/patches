(function() {
var GraphPlugin = E2.plugins.graph = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and the encapsulated logic of which can be optinally rendered to a <b>texture</b> instead of the framebuffer.';
	
	this.input_slots = [
		{ name: 'enabled', dt: core.datatypes.BOOL, desc: 'En- or disable the processing of the nested graph logic.', def: true }
	]
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'When connected, all enclosed plugins will render to this texture instead of the framebuffer. Also, when connected two dynamic input slots will appear that allows control of the texture resolution.', def: 'Render to framebuffer' }
	]
	
	this.state = { 
		enabled: true, 
		always_update: true, 
		rt_width: 512, 
		rt_height: 512,
		rt_filter: core.renderer.context.LINEAR,
		input_sids: {}, 
		output_sids: {}
	};
		
	this.is_reset = true;
	this.framebuffer = null;
	this.texture = null;
	this.renderbuffer = null
}

GraphPlugin.prototype = Object.create(SubGraphPlugin.prototype)

GraphPlugin.prototype.getWidth = function() {
	return parseFloat(this.framebuffer.width)
}

GraphPlugin.prototype.getHeight = function() {
	return parseFloat(this.framebuffer.height)
}

GraphPlugin.prototype.open_editor = function(self)
{
	var diag = make('div');
	var always_upd = $('<input id="always_upd" type="checkbox" title="If false, this graph is updated only when one of its inputs updates." />');
	var width_inp = $('<select />');
	var height_inp = $('<select />');
	var filter_inp = $('<select />');
	var upd_lbl = $('<div>Always update:</div>');
	var width_lbl = $('<div>Texture width:</div>');
	var height_lbl = $('<div>Texture height:</div>');
	var filter_lbl = $('<div>Texture filtering:</div>');
	var r1 = make('div'), r2 = make('div'), r3 = make('div'), r4 = make('div');
	var gl = this.gl;
	
	var lbl_css = {
		'font-size': '14px',
		'float': 'left',
		'padding': '8px 0px 2px 2px',
	};
	
	var inp_css = {
		'float': 'right',
		'margin': '2px',
		'padding': '2px',
		'width': '70px'
	};

	diag.css({
		'margin': '0px',
		'padding': '2px',
	});

	for(var i = 1; i < 13; i++)
	{
		var d = Math.pow(2, i);
		
		$('<option />', { value: d, text: '' + d }).appendTo(width_inp);
		$('<option />', { value: d, text: '' + d }).appendTo(height_inp);
	}
	
	$('<option />', { value: gl.NEAREST, text: 'Nearest' }).appendTo(filter_inp);
	$('<option />', { value: gl.LINEAR, text: 'Linear' }).appendTo(filter_inp);
	filter_inp.val(self.state.rt_filter);

	r1.css('clear', 'both');
	r2.css('clear', 'both');
	r3.css('clear', 'both');
	r4.css('clear', 'both');
	r4.addClass('clearfix');

	always_upd.css(inp_css);
	width_inp.css(inp_css);
	height_inp.css(inp_css);
	filter_inp.css(inp_css);
	upd_lbl.css(lbl_css);
	width_lbl.css(lbl_css);
	height_lbl.css(lbl_css);
	filter_lbl.css(lbl_css);
	always_upd.css({ 'width': '13px', 'margin-top': '8px' });
	
	always_upd.attr('checked', self.state.always_update);
	width_inp.val(self.state.rt_width);
	height_inp.val(self.state.rt_height);
	
	r1.append(upd_lbl);
	r1.append(always_upd);
	diag.append(r1);
	diag.append(make('br'));
	r2.append(width_lbl);
	r2.append(width_inp);
	diag.append(r2);
	diag.append(make('br'));
	r3.append(height_lbl);
	r3.append(height_inp);
	diag.append(r3);
	diag.append(make('br'));
	r4.append(filter_lbl);
	r4.append(filter_inp);
	diag.append(r4);
	
	var store_state = function(self, always_upd, width_inp, height_inp, filter_inp) { return function()
	{
		self.state.always_update = always_upd.is(":checked");
		
		var w = width_inp.val(), h = height_inp.val(), f = filter_inp.val();
		var refresh = self.state.rt_width !== w || self.state.rt_height !== h || self.state.rt_filter !== f;
		
		self.state.rt_width = w;
		self.state.rt_height = h;
		self.state.rt_filter = f;
		
		if(self.framebuffer && refresh)
		{
			self.delete_framebuffer();
			self.set_render_target_state(true);
		}
	}};
	
	self.core.create_dialog(diag, 'Edit Preferences.', 460, 250, store_state(self, always_upd, width_inp, height_inp, filter_inp));
};

GraphPlugin.prototype.create_ui = function() {
	var ui = make('div');
	var inp_edit = makeButton('Edit', 'Open this graph for editing.');
	
	inp_edit.click(function(self) { return function() 
	{
		if(self.graph)
		{
			var ptn = self.graph.parent_graph.tree_node;
			
			if(!ptn.open)
			{
				ptn.graph.open = true;
				ptn.rebuild_dom();
			}
			
			self.graph.tree_node.activate();
		}
	}}(this));
	
	ui.css('text-align', 'center');
	ui.append(inp_edit);
	
	this.ui = ui;
	
	return ui;
}

GraphPlugin.prototype.delete_framebuffer = function() {
	var gl = this.gl;
	
	if(this.framebuffer)
		gl.deleteFramebuffer(this.framebuffer);

	if(this.renderbuffer)
		gl.deleteRenderbuffer(this.renderbuffer);
	
	if(this.texture)
		this.texture.drop();

	this.framebuffer = null;
	this.renderbuffer = null;
	this.texture = null;
};

GraphPlugin.prototype.set_render_target_state = function(on)
{
	var gl = this.gl;
	
	if(on)
	{
		this.framebuffer = gl.createFramebuffer();
		this.framebuffer.width = this.state.rt_width;
		this.framebuffer.height = this.state.rt_height;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

		var t = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.state.rt_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.state.rt_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		this.renderbuffer = gl.createRenderbuffer();
		
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		this.texture = new Texture(this.core.renderer, t, this.state.rt_filter);
		this.texture.width = this.framebuffer.width;
		this.texture.height = this.framebuffer.height;
		this.texture.framebuffer = this.framebuffer;
	}
	else
	{
		// Check whether there remains any residual connected consumers
		// of our render target texture.
		var in_use = false;
		var outputs = this.parent_node.outputs;
		
		for(var i = 0, len = outputs.length; i < len; i++)
		{
			var ss = outputs[i].src_slot;
			
			if(ss.uid === undefined && ss.type === E2.slot_type.output)
			{
				in_use = true;
				break;
			}
		}
		
		if(!in_use)
			this.delete_framebuffer();
	}
};

GraphPlugin.prototype.update_input = function(slot, data) {
	if (slot.uid === undefined) {
		if (slot.index === 0) {
			this.state.enabled = data;
		
			if (!data) {
				if(this.graph && !this.is_reset) {
					this.is_reset = true;
					
					if (this.graph === E2.app.player.core.active_graph && this.ui) {
						var core = this.core;
						var conns = this.graph.connections;
		
						for (var i = 0, len = conns.length; i < len; i++)
							conns[i].ui.flow = false;
					
						// If we're the active graph and the editor is active,
						// update the canvas to reflect potentially changed 
						// connection state.
						if (this.graph === core.active_graph && core.app)
							core.app.updateCanvas(false);
					}
				}
			} else
				this.is_reset = false;
		}
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data);
	}
}

GraphPlugin.prototype.update_state = function() {
	this.updated = false;
	this.updated_sids.length = 0;

	if(this.graph && this.state.enabled) {
		if(this.framebuffer) {
			var gl = this.gl;
			
			this.core.renderer.push_framebuffer(this.framebuffer, this.framebuffer.width, this.framebuffer.height);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}
		
		if(this.graph.update() && this.graph === E2.app.player.core.active_graph)
			E2.app.updateCanvas(false);

		if(this.framebuffer)
			this.core.renderer.pop_framebuffer();
	}
};

GraphPlugin.prototype.state_changed = function(ui) {
	var core = this.core;
	var node = this.parent_node;
	var self = this;
	
	// Only rebuild the node lists during post-load patch up of the graph, 
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
	// every time we switch to the graph containing this node in the editor.
	if (ui) {
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph');

		var inp_config = makeButton(null, 'Edit preferences.', 'config_btn');

		inp_config.click(function() {
			self.open_editor(self);
		})
		
		$(node.ui.dom[0].children[0].children[0].children[0]).append(inp_config);
		return;
	}
	
	this.setupProxies()

	var conns = node.outputs;
	
	for(var i = 0, len = conns.length; i < len; i++)
	{
		var c = conns[i];
		
		if(c.src_node === node && c.src_slot.uid === undefined && c.src_slot.index === 0)
		{
			this.set_render_target_state(true);
			break; // Early out and don't double init if connected to multiple inputs.
		}
	}
};


})()