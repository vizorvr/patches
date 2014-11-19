E2.p = E2.plugins["graph"] = function(core, node)
{
	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and the encapsulated logic of which can be optinally rendered to a <b>texture</b> instead of the framebuffer.';
	
	this.input_slots = [
		{ name: 'enabled', dt: core.datatypes.BOOL, desc: 'En- or disable the processing of the nested graph logic.', def: true }
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'When connected, all enclosed plugins will render to this texture instead of the framebuffer. Also, when connected two dynamic input slots will appear that allows control of the texture resolution.', def: 'Render to framebuffer' }
	];
	
	this.state = { 
		enabled: true, 
		always_update: true, 
		rt_width: 512, 
		rt_height: 512,
		rt_filter: core.renderer.context.LINEAR,
		input_sids: {}, 
		output_sids: {}
	};
		
	this.gl = core.renderer.context;
	this.core = core;
	this.input_nodes = {};
	this.output_nodes = {};
	this.ui = null;
	this.is_reset = true;
	this.parent_node = node; // For reverse lookup in the core.
	this.updated_sids = [];
	this.framebuffer = null;
	this.texture = null;
	this.renderbuffer = null;
	this.e2_is_graph = true; // Constant. To get rid of string compares from the core.
};

E2.p.prototype.reset = function()
{
	this.state.enabled = true;
	
	if(this.graph)
		this.graph.reset();
};

E2.p.prototype.play = function()
{
	if(this.graph)
		this.graph.pause();
};

E2.p.prototype.pause = function()
{
	if(this.graph)
		this.graph.pause();
};

E2.p.prototype.stop = function()
{
	if(this.graph)
		this.graph.stop();
};

E2.p.prototype.open_editor = function(self)
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
	
	var store_state = function(self, always_upd, width_inp, height_inp, filter_inp) { return function(e)
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

E2.p.prototype.create_ui = function()
{
	var ui = make('div');
	var inp_edit = makeButton('Edit', 'Open this graph for editing.');
	
	inp_edit.click(function(self) { return function(e) 
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
};

E2.p.prototype.get_dt_name = function(dt)
{
	if(!dt || !dt.name)
		return 'ERROR';
		
	return dt.name;
};

E2.p.prototype.dbg = function(str)
{
	// msg('Graph: ' + str);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(slot.uid !== undefined)
	{
		var psl = null;
		var core = this.core;
		
		if(!on)
		{
			if(slot.type === E2.slot_type.input)
			{
				var inode = this.input_nodes[slot.uid];
				
				psl = inode.dyn_outputs[0];
				inode.plugin.data = core.get_default_value(slot.dt);
				inode.reset();
			}
			else
			{
				var node = this.parent_node;
				var count = 0;
				
				for(var i = 0, len = node.outputs.length; i < len; i++)
				{
					if(node.outputs[i].src_slot === slot)
						count++;
				}
				
				if(count === 0)
					psl = this.output_nodes[slot.uid].dyn_inputs[0];
			}

			if(psl && !psl.connected)
			{
				psl.dt = slot.dt = core.datatypes.ANY;
				this.dbg('Resetting PDT/GDT for slot(' + slot.uid + ')');
			}
		}
		else
		{
			var tn = null;
			
			if(slot.type === E2.slot_type.input)
			{
				if(slot.dt === core.datatypes.ANY)
				{
					slot.dt = conn.src_slot.dt;
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.src_slot.dt));
				}
				
				tn = this.input_nodes[slot.uid];
				psl = tn.dyn_outputs[0];
			}
			else
			{
				if(slot.dt === core.datatypes.ANY)
				{
					slot.dt = conn.dst_slot.dt;
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.dst_slot.dt));
				}
				
				tn = this.output_nodes[slot.uid];
				psl = tn.dyn_inputs[0];
			}
			
			if(psl.dt === core.datatypes.ANY)
			{
				this.dbg('Setting PDT for slot(' + psl.uid + ') to ' + this.get_dt_name(slot.dt));
				psl.dt = slot.dt;
				tn.plugin.data = core.get_default_value(slot.dt);
			}
		}
	}
	else if(slot.type === E2.slot_type.output)
	{
		this.set_render_target_state(on);
	}
};

E2.p.prototype.delete_framebuffer = function(on)
{
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

E2.p.prototype.set_render_target_state = function(on)
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
	
E2.p.prototype.proxy_connection_changed = function(on, p_node, t_node, slot, t_slot)
{
	var self = this;
	var core = this.core;
	var node = this.parent_node;
	
	var find_sid = function(nodes, uid)
	{
		for(var n in nodes)
		{		
			if(nodes[n].uid === uid)
				return parseInt(n);
		}
		
		msg('ERROR: Failed to resolve node(' + uid + ') in graph(' + self.graph.plugin.parent_node.title + ').');
		return -1;
	};
	
	var is_gslot_connected = function(gslot)
	{
		if(gslot.type === E2.slot_type.input)
		{
			for(var i = 0, len = node.inputs.length; i < len; i++)
			{
				if(node.inputs[i].dst_slot === gslot)
					return true;
			} 
		}
		else
		{
			for(var i = 0, len = node.outputs.length; i < len; i++)
			{
				if(node.outputs[i].src_slot === gslot)
					return true;
			} 
		}
		
		return false;
	};
	
	var change_slots = function(last, g_slot, p_slot)
	{
		self.dbg('Proxy slot change ' + on + ', last = ' + last + ', g_slot = ' + g_slot.uid + ', p_slot = ' + p_slot.uid);
		
		p_slot.connected = true;
		
		if(on)
		{
			if(p_slot.dt === core.datatypes.ANY)
			{
				p_slot.dt = t_slot.dt;		
				self.dbg('    Setting PDT to ' + self.get_dt_name(t_slot.dt) + '.');
			
				if(g_slot.dt === core.datatypes.ANY)
				{
					p_node.plugin.data = core.get_default_value(t_slot.dt);
				}
			}

			if(g_slot.dt === core.datatypes.ANY)
			{
				g_slot.dt = t_slot.dt;		
				self.dbg('    Setting GDT to ' + self.get_dt_name(t_slot.dt) + '.');
			}
		}
		else if(last)
		{
			var conns = node.parent_graph.connections;
			var connected = false;
			
			for(var i = 0, len = conns.length; i < len; i++)
			{
				var c = conns[i];
				
				if(c.dst_slot === g_slot || c.src_slot === g_slot)
				{
					connected = true;
					break;
				}
			}
			
			p_slot.connected = false;

			if(!connected)
			{
				p_slot.dt = g_slot.dt = core.datatypes.ANY;
				self.dbg('    Reverting to PDT/GDT to ANY.');
			}

			if(t_node.plugin.id === 'input_proxy')
			{
				connected = false;
				
				for(var i = 0, len = t_node.outputs.length; i < len; i++)
				{
					if(t_node.outputs[i].src_slot === t_slot)
					{
						connected = true;
						break;
					}
				}
				
				var rgsl = node.find_dynamic_slot(E2.slot_type.input, find_sid(self.input_nodes, t_node.uid));
				
				if(!connected && !is_gslot_connected(rgsl))
				{
					t_slot.dt = rgsl.dt = core.datatypes.ANY;
					self.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.');
				}
			}
			else if(t_node.plugin.id === 'output_proxy')
			{
				var rgsl = node.find_dynamic_slot(E2.slot_type.output, find_sid(self.output_nodes, t_node.uid));
				
				if(!is_gslot_connected(rgsl))
				{
					t_slot.dt = rgsl.dt = core.datatypes.ANY;
					self.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.');
				}
			}
		}
	};
	
	if(p_node.plugin.id === 'input_proxy')
	{
		var last = p_node.outputs.length === 0;
		
		change_slots(last, node.find_dynamic_slot(E2.slot_type.input, find_sid(this.input_nodes, p_node.uid)), slot);
		this.dbg('    Output count = ' + p_node.outputs.length);
	}
	else
	{
		var last = p_node.inputs.length === 0;
		
		change_slots(last, node.find_dynamic_slot(E2.slot_type.output, find_sid(this.output_nodes, p_node.uid)), slot);
		this.dbg('    Input count = ' + p_node.inputs.length);
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.uid === undefined)
	{
		if(slot.index === 0)
		{
			this.state.enabled = data;
		
			if(!data)
			{
				if(this.graph && !this.is_reset)
				{
					this.is_reset = true;
					
					if(this.graph === E2.app.player.core.active_graph && this.ui)
					{
						var core = this.core;
						var conns = this.graph.connections;
		
						for(var i = 0, len = conns.length; i < len; i++)
							conns[i].ui.flow = false;
					
						// If we're the active graph and the editor is active,
						// update the canvas to reflect potentially changed 
						// connection state.
						if(this.graph === core.active_graph && core.app)
							core.app.updateCanvas(false);
					}
				}
			}
			else
				this.is_reset = false;
		}
	}
	else
	{
		this.input_nodes[slot.uid].plugin.input_updated(data);
	}
};

E2.p.prototype.update_state = function()
{
	this.updated = false;
	this.updated_sids.length = 0;
	
	if(this.graph && this.state.enabled)
	{
		var old_fb = null;
		
		if(this.framebuffer)
		{
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

E2.p.prototype.update_output = function(slot)
{
	if(slot.uid !== undefined)
		return this.output_nodes[slot.uid].plugin.data;
		
	this.updated = true; // Oooh!
	return this.texture;
};

E2.p.prototype.query_output = function(slot)
{
	return (slot.uid === undefined) || this.updated_sids.indexOf(slot.uid) > -1;
};

E2.p.prototype.destroy_slot = function(type, nuid)
{
	var slots = (type === E2.slot_type.input) ? this.state.input_sids : this.state.output_sids;
	var sid = slots[nuid];
	
	delete slots[nuid];
	this.parent_node.remove_slot(type, sid);
};

E2.p.prototype.graph_event = function(self) { return function(ev)
{
	var pid = ev.node.plugin.id;
	var core = self.core;
	var node = self.parent_node;
	
	if(pid !== 'input_proxy' && pid !== 'output_proxy')
		return;
	
	self.dbg('Gevent type = ' + ev.type + ', node uid = ' + ev.node.uid);
	
	if(ev.type === 'node-created')
	{
		if(pid === 'input_proxy')
		{
			var sid = node.add_slot(E2.slot_type.input, { name: '' + ev.node.title, dt: core.datatypes.ANY });
			
			self.state.input_sids[ev.node.uid] = sid;
			self.input_nodes[sid] = ev.node;
		}
		else if(pid === 'output_proxy')
		{
			var sid = node.add_slot(E2.slot_type.output, { name: '' + ev.node.title, dt: core.datatypes.ANY });
			
			self.state.output_sids[ev.node.uid] = sid;
			self.output_nodes[sid] = ev.node;
		}
	}
	else if(ev.type === 'node-destroyed')
	{
		if(pid === 'input_proxy')
			self.destroy_slot(E2.slot_type.input, ev.node.uid);
		else if(pid === 'output_proxy')
			self.destroy_slot(E2.slot_type.output, ev.node.uid);
	}
	else if(ev.type === 'node-renamed')
	{
		if(pid === 'input_proxy')
			node.rename_slot(E2.slot_type.input, self.state.input_sids[ev.node.uid], ev.node.title);
		else if(pid === 'output_proxy')
			node.rename_slot(E2.slot_type.output, self.state.output_sids[ev.node.uid], ev.node.title);
	}
}};

E2.p.prototype.state_changed = function(ui)
{
	var core = this.core;
	var node = this.parent_node;
	var self = this;
	
	// Only rebuild the node lists during post-load patch up of the graph, 
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
	// every time we switch to the graph containing this node in the editor.
	if(ui)
	{
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph');

		var inp_config = makeButton(null, 'Edit preferences.', 'config_btn');

		inp_config.click(function(self) { return function(e) 
		{
			self.open_editor(self);
		}}(this));
		
		$(node.ui.dom[0].children[0].children[0].children[0]).append(inp_config);
		return;
	}
	
	var find_node = function(nodes, uid)
	{
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			if(nodes[i].uid === uid)
			{
				var n = nodes[i];
				var p = n.plugin;
				
				p.data = core.get_default_value((p.id === 'input_proxy' ? n.dyn_outputs : n.dyn_inputs)[0].dt);
				return n;
			}
		}

		msg('ERROR: Failed to find registered proxy node(' + uid + ') in graph(' + self.graph.plugin.parent_node.title + ').'); 
		return null;
	};

	for(var uid in this.state.input_sids)
		this.input_nodes[this.state.input_sids[uid]] = find_node(this.graph.nodes, parseInt(uid));

	for(var uid in this.state.output_sids)
		this.output_nodes[this.state.output_sids[uid]] = find_node(this.graph.nodes, parseInt(uid));
		
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
