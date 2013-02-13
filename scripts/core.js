/*
 * Engi.
 *
 * Authors: Lasse Jul Nielsen.
 * Web: http://www.effekts.dk
 *
 * Not for public dessemination. No license is granted for any use not explicitly authorized.
 *
 */

function E2()
{
};

E2.app = null;
E2.dom = {};
E2.plugins = {};
E2.slot_type = { input: 0, output: 1 };
E2.erase_color = '#ff3b3b';

// Monkey-patch the window object with a request/cancelAnimationFrame shims.
window.requestAnimFrame = (function()
{
	return window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame
})();

window.cancelAnimFrame = (function()
{
	return window.cancelAnimationFrame       || 
		window.webkitCancelAnimationFrame || 
		window.mozCancelAnimationFrame
})();

function AssertException(message) 
{ 
	this.message = message;
	
	this.toString = function()
	{
		return 'AssertException: ' + this.message;
	};
}

function assert(exp, message) 
{
	if (!exp)
		throw new AssertException(message);
}

Array.prototype.remove = function(obj)
{
	var i = this.indexOf(obj);
	
	if(i !== -1)
		this.splice(i, 1);
};

function clone(o)
{
	var no = (o instanceof Array) ? [] : {};

	for(var i in o) 
	{
		if(o[i] && typeof(o[i]) === 'object') 
			no[i] = clone(o[i]);
		else
			no[i] = o[i];
	} 
	
	return no;
};

function msg(txt)
{
	var d = E2.dom.dbg;

	if(d === undefined)
		return;
	
	if(txt.substring(0,  7) !== 'ERROR: ')
		d.append(txt + '\n');
	else
	{
		d.append('<span style="color:#f00">' + txt + '</span>\n');
		Notifier.error(txt.substring(7, txt.length-7));
	}
	
	d.scrollTop(d[0].scrollHeight);
}

function make(tag)
{
	return $(document.createElement(tag));
}

function sort_dict(dict)
{
	var s = [], key;
	
	for(key in dict)
		s.push(key);
		
	s.sort();
	return s;
}

function resolve_graph(graphs, guid)
{
	for(var i = 0, len = graphs.length; i < len; i++)
	{
		if(graphs[i].uid === guid)
			return graphs[i]; 
	}

	if(guid !== -1)
		msg('ERROR: Failed to resolve graph(' + guid + ')');
	
	return null;
};

function load_script(url)
{
	var script = document.createElement('script');
	var async = document.createAttribute('async');
	
	async.nodeValue = 'false';

	script.src = url;
	script.attributes.setNamedItem(async);
	
	document.getElementById('head').appendChild(script);
}

function Delegate(delegate, count)
{
	this.delegate = delegate;
	this.count = count;
}

function PluginGroup(id)
{
	var self = this;
	
	this.id = id;
	this.children = {};
	this.entries = {};
}
	
PluginGroup.prototype.get_or_create_group = function(id)
{
	var g = this.children[id];
	
	if(!g)
	{
		g = new PluginGroup(id);
		this.children[id] = g;
	}
	
	return g;
};
	
PluginGroup.prototype.add_entry = function(name, id)
{
	var e = this.entries[name];
	
	assert(!e, 'Plugin keys must be unique, but a duplicate instance of the key "' + id + '" was found in plugins.json.');
	this.entries[name] = id;
};
	
PluginGroup.prototype.insert_relative = function(key, id)
{
	var tokens = key.split('/');
	
	assert(tokens.length > 0, 'Plugin key cannot be empty.');
	
	var g = this, len = tokens.length - 1;
	
	for(var i = 0; i < len; i++)
		g = g.get_or_create_group(tokens[i]);
	
	var key = tokens[len];
	
	g.add_entry(key, id);
	
	return key;
};
	
PluginGroup.prototype.create_items = function()
{
	var items = []
	var sorted = sort_dict(this.children);
	
	for(var i = 0, len = sorted.length; i < len; i++)
	{
		var id = sorted[i];
		var child = this.children[id];
		
		items.push({ name: id, items: child.create_items() });
		
	}
	
	sorted = sort_dict(this.entries);
	
	for(var i = 0, len = sorted.length; i < len; i++)
	{
		var id = sorted[i];
		var entry = this.entries[id];
		
		items.push({ name: id, icon: entry });
	}
		
	return items;
};

function PluginManager(core, base_url, creation_listener) 
{
	var self = this;

	this.base_url = base_url;
	this.core = core;
	this.keybyid = {};
	this.release_mode = false;
	this.lid = 1;
	this.context_menu = null;
	
	// First check if we're running a release build by checking for the existence
	// of 'all.plugins.js'
	var url = self.base_url + '/all.plugins.js';
	
	$.ajax({
		url: url,
		type: 'HEAD',
		async: false,
		success: function() 
		{
			msg('PluginMgr: Running in release mode');
			self.release_mode = true;
			load_script(url);
		},
		error: function()
		{
			msg('PluginMgr: Running in debug mode');
		}
	});

	this.register_plugin = function(pg_root, key, id)
	{
		self.keybyid[id] = pg_root.insert_relative(key, id);
		msg('\tLoaded ' + id + ' (' + self.lid + ')');
		self.lid++;
	};

	$.ajax({
		url: self.base_url + '/plugins.json',
		dataType: 'json',
		async: false,
		headers: {},
		success: function(data)
		{
			var pg_root = new PluginGroup('root');
			
			$.each(data, function(key, id) 
			{
				// Load the plugin, constrain filenames.
				var url = self.base_url + '/' + id + '.plugin.js';

   				if(!self.release_mode)
   				{
	   				msg('Loading ' + id);
					load_script(url);
   				}
   				
				self.register_plugin(pg_root, key, id);
			});
			
			if(creation_listener)
				self.context_menu = new ContextMenu(E2.dom.canvas_parent, pg_root.create_items(), creation_listener);
  		}
	});
}
 
PluginManager.prototype.create = function(id, node) 
{
	if(E2.plugins.hasOwnProperty(id))
	{
		var p = new E2.plugins[id](this.core, node);
		
		p.id = id;
		
		return p;
	}
		 
	assert(true, 'Failed to resolve plugin with id \'' + id + '\'. Please check that the right id is specified by the plugin implementation.');
	return null;
};

function SnippetManager(base_url)
{
	var self = this;
	
	this.listbox = $('#snippets-list');
	this.base_url = base_url;
	
	var url = self.base_url + '/snippets.json';
	
	$.ajax({
		url: url,
		dataType: 'json',
		async: false,
		headers: {},
		success: function(data) 
		{
			msg('SnippetsMgr: Loading snippets from: ' + url);

			$.each(data, function(key, snippets)
			{
				self.register_group(key);
				
				$.each(snippets, function(name, id)
				{
					self.register_snippet(name, self.base_url + '/' + id + '.json')
				});
			});
		},
		error: function()
		{
			msg('SnippetsMgr: No snippets found.');
		}
	});
	
	$('#load-snippet').button().click(function()
	{
		var url = self.listbox.val();
		
		msg('Loading snippet from: ' + url);
		
		$.ajax({
			url: url,
			dataType: 'json',
			async: false,
			headers: {},
			success: function(data)
			{
	  			E2.app.fillCopyBuffer(data.root.nodes, data.root.conns, 0, 0);
	  			E2.app.onPaste({ target: { id: 'notpersist' }});
	  		},
	  		error: function()
	  		{
	  			Notifier.error('Failed to load the selected snippet.', 'Cogent');
	  		}
		});
	});
}

SnippetManager.prototype.register_group = function(label)
{
	this.listbox.append('<optgroup label="' + label + '" class="snippet-group"></optgroup>');
};

SnippetManager.prototype.register_snippet = function(name, url)
{
	this.listbox.append('<option value="' + url + '">' + name + '</option>');
};
	
function ConnectionUI(parent_conn)
{
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
	this.src_slot_div = null;
	this.dst_slot_div = null;
	this.flow = false;
	this.selected = false;
	this.deleting = false;
	this.parent_conn = parent_conn;
	this.color = '#000';
}

ConnectionUI.prototype.resolve_slot_divs = function()
{
	var pc = this.parent_conn;
	
	this.src_slot_div = pc.src_node.ui.dom.find('#n' + pc.src_node.uid + (pc.src_slot.uid !== undefined ? 'do' + pc.src_slot.uid : 'so' + pc.src_slot.index));
	this.dst_slot_div = pc.dst_node.ui.dom.find('#n' + pc.dst_node.uid + (pc.dst_slot.uid !== undefined ? 'di' + pc.dst_slot.uid : 'si' + pc.dst_slot.index));
	// assert(self.src_slot_div !== null && self.dst_slot_div !== null, 'Failed to resolve connection slot div.'); 
	
	this.src_pos = E2.app.getSlotPosition(this.src_slot_div, E2.slot_type.output);
	this.dst_pos = E2.app.getSlotPosition(this.dst_slot_div, E2.slot_type.input);
	// assert(self.src_pos !== null && self.dst_pos !== null, 'Failed to resolve connection slot div position.'); 
};

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	this.offset = 0;
}

Connection.prototype.create_ui = function()
{
	this.ui = new ConnectionUI(this);
};

Connection.prototype.destroy_ui = function()
{
	if(this.ui)
		this.ui = null;
};

Connection.prototype.reset = function()
{
	if(this.ui && this.ui.flow)
	{
		this.ui.flow = false;
		this.ui.color = '#000';
	}
};

Connection.prototype.r_update_inbound = function(node)
{
	node.queued_update = 1;
	
	if(node.plugin.id !== 'input_proxy')
	{
		for(var i = 0, len = node.inputs.length; i < len; i++)
			this.r_update_inbound(node.inputs[i].src_node);
	}
	else
	{
		var rp = node.parent_graph.plugin;
		
		if(rp && rp.parent_node.queued_update < 1 && rp.state.enabled)
			this.r_update_inbound(rp.parent_node);
	}
}

Connection.prototype.r_update_outbound = function(node)
{
	node.queued_update = 2;
	
	if(node.plugin.id !== 'output_proxy')
	{
		for(var i = 0, len = node.outputs.length; i < len; i++)
			this.r_update_outbound(node.outputs[i].dst_node);
	}
	else
	{
		var rp = node.parent_graph.plugin;
		
		if(rp && rp.parent_node.queued_update < 2 && rp.state.enabled)
			this.r_update_outbound(rp.parent_node);
	}
}

Connection.prototype.signal_change = function(on)
{
	var n = this.src_node;
	
	if(n.plugin.connection_changed)
	{
		n.plugin.connection_changed(on, this, this.src_slot);
		
		if(n.plugin.reset)
			n.plugin.reset();
	}
	
	n = this.dst_node;
	n.inputs_changed = true;
	
	if(n.plugin.connection_changed)
	{
		n.plugin.connection_changed(on, this, this.dst_slot);
		n.plugin.updated = true;
	}
	
	if(on)
	{
		this.r_update_inbound(n);
		this.r_update_outbound(n);
	}
};

Connection.prototype.serialise = function()
{
	var d = {};
	
	d.src_nuid = this.src_node.uid;
	d.dst_nuid = this.dst_node.uid;
	d.src_slot = this.src_slot.index;
	d.dst_slot = this.dst_slot.index;
	
	d.src_connected = this.src_slot.connected;
	d.dst_connected = this.dst_slot.connected;
	
	if(this.src_slot.uid !== undefined)
		d.src_dyn = true;
	
	if(this.dst_slot.uid !== undefined)
		d.dst_dyn = true;

	if(this.offset !== 0)
		d.offset = this.offset;
	
	return d;
};

Connection.prototype.deserialise = function(d)
{
	this.src_node = d.src_nuid;
	this.dst_node = d.dst_nuid;
	this.src_slot = { index: d.src_slot, dynamic: d.src_dyn ? true : false, connected: d.src_connected };
	this.dst_slot = { index: d.dst_slot, dynamic: d.dst_dyn ? true : false, connected: d.dst_connected };
	this.offset = d.offset ? d.offset : 0;
};

Connection.prototype.patch_up = function(nodes)
{
	var resolve_node = function(nuid)
	{
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			if(nodes[i].uid === nuid)
				return nodes[i];
		}
		
		msg('ERROR: Failed to resolve node with uid = ' + nuid);
		return null;
	};
	
	this.src_node = resolve_node(this.src_node);
	this.dst_node = resolve_node(this.dst_node);
	
	if(!this.src_node || !this.dst_node)
	{
		msg('ERROR: Source or destination node invalid - dropping connection.');
		return false;
	}
	
	this.src_slot = (this.src_slot.dynamic ? this.src_node.dyn_outputs : this.src_node.plugin.output_slots)[this.src_slot.index];
	this.dst_slot = (this.dst_slot.dynamic ? this.dst_node.dyn_inputs : this.dst_node.plugin.input_slots)[this.dst_slot.index];
	
	if(!this.src_slot || !this.dst_slot)
	{
		msg('ERROR: Source or destination slot invalid - dropping connection.');
		return false;
	}
		
	this.dst_slot.is_connected = true;
	
	if(this.src_slot.connected)
		this.src_slot.connected = true;

	if(this.dst_slot.connected)
		this.dst_slot.connected = true;

	this.src_node.outputs.push(this);
	this.dst_node.inputs.push(this);
	
	return true;
};

function draggable_mouseup(data) { return function(e)
{
	data.doc.unbind('mouseup.draggable');
	data.doc.unbind('mousemove.draggable');
		
	data.stop(e);
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function draggable_mousemove(data) { return function(e)
{
	var ui = data.ui[0];
	var nx = data.oleft + e.pageX - data.ox;
	var ny = data.otop + e.pageY - data.oy;
	var cp = E2.dom.canvas_parent;
	var co = cp.offset();
	
	if(e.pageX < co.left)
	{	
		cp.scrollLeft(cp.scrollLeft() - 20); 
		nx -= 20;
	}
	else if(e.pageX > co.left + cp.width())
	{	
		cp.scrollLeft(cp.scrollLeft() + 20); 
		nx += 20;
	}
	
	if(e.pageY < co.top)
	{
		cp.scrollTop(cp.scrollTop() - 20);
		ny -= 20;
	}
	else if(e.pageY > co.top + cp.height())
	{
		cp.scrollTop(cp.scrollTop() + 20);
		ny += 20;
	}

	nx = nx < 0 ? 0 : nx;
	ny = ny < 0 ? 0 : ny;
	
	ui.style.left = nx + 'px';
	ui.style.top = ny + 'px';
	
	data.oleft = nx;
	data.otop = ny;
	data.ox = e.pageX;
	data.oy = e.pageY;
	
	data.drag(e);
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function draggable_mousedown(ui, drag, stop) { return function(e)
{
	if(e.target.id !== 't')
		return true;

	var data = 
	{ 
		ui: ui,
		oleft: parseInt(ui[0].style.left) || 0,
		otop: parseInt(ui[0].style.top) || 0,
		ox: e.pageX || e.screenX,
		oy: e.pageY || e.screenY,
		drag: drag,
		stop: stop,
		doc: $(document)
	};

	data.doc.bind('mouseup.draggable', draggable_mouseup(data));
	data.doc.bind('mousemove.draggable', draggable_mousemove(data));
	
	if(e.stopPropagation) e.stopPropagation();
	if(e.preventDefault) e.preventDefault();
	return false;
};}

function make_draggable(ui, drag, stop)
{
	ui.mousedown(draggable_mousedown(ui, drag, stop));
}

function NodeUI(parent_node, x, y) {
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	this.sl = E2.app.scrollOffset[0];
	this.st = E2.app.scrollOffset[1];
	this.plugin_ui = null;
	
	var nid = 'n' + parent_node.uid, dom = this.dom = make('table');
	
	dom.addClass('plugin');
	dom.addClass('ui-widget-content');
	dom.attr('id', nid);
	dom.mousemove(E2.app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	dom.addClass('pl_layout');
	
	var h_row = make('tr');
	var h_cell = make('td');
	var icon = make('span');
	var lbl = make('span');
	
	icon.addClass('plugin-icon');
	icon.addClass('icon-' + parent_node.plugin.id);
	
	h_cell.append(icon);
	lbl.text(parent_node.get_disp_name());
	lbl.attr('id', 't');
	
	h_cell.append(lbl);
	h_cell.attr('colspan', '3');
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(E2.app.onNodeHeaderClicked);
	h_row.dblclick(E2.app.onNodeHeaderDblClicked(parent_node));
	h_row.mouseenter(E2.app.onNodeHeaderEntered(parent_node));
	h_row.mouseleave(E2.app.onNodeHeaderExited);

	if(parent_node.plugin.desc)
	{
		var p_name = E2.app.player.core.plugin_mgr.keybyid[parent_node.plugin.id];
		
		h_row.attr('alt', '<b>' + p_name + '</b><br/><hr/>' + parent_node.plugin.desc);
		h_row.hover(E2.app.onShowTooltip, E2.app.onHideTooltip);
	}

	dom.append(h_row);
	
	this.header_row = h_row;
	
	var row = make('tr');
	
	dom.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.attr('id', 'ic');
	content_col.addClass('pui_col');
	content_col.attr('id', 'cc');
	output_col.attr('id', 'oc');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	NodeUI.render_slots(parent_node, nid, input_col, parent_node.plugin.input_slots, E2.slot_type.input);
	NodeUI.render_slots(parent_node, nid, output_col, parent_node.plugin.output_slots, E2.slot_type.output);
	
	if(parent_node.dyn_inputs)
		NodeUI.render_slots(parent_node, nid, input_col, parent_node.dyn_inputs, E2.slot_type.input);
	
	if(parent_node.dyn_outputs)
		NodeUI.render_slots(parent_node, nid, output_col, parent_node.dyn_outputs, E2.slot_type.output);

	var plugin = parent_node.plugin;
	
	if(plugin.create_ui)
	{
		this.plugin_ui = plugin.create_ui();
		
		content_col.append(this.plugin_ui);
	}
	else
		this.plugin_ui = {}; // We must set a dummy object so plugins can tell why they're being called.
	
	make_draggable(dom, E2.app.onNodeDragged(parent_node), E2.app.onNodeDragStopped(parent_node));
    	
	var s = dom[0].style;
	
	s.left = '' + x + 'px';
	s.top = '' + y + 'px';
	E2.dom.canvas_parent.append(dom);
}

NodeUI.create_slot = function(parent_node, nid, col, s, type)
{
	var div = make('div');

	if(s.uid !== undefined)
		div.attr('id', nid + (type === E2.slot_type.input ? 'di' : 'do') + s.uid);
	else
		div.attr('id', nid + (type === E2.slot_type.input ? 'si' : 'so') + s.index);

	div.text(s.name);
	div.addClass('pl_slot');
	div.definition = s;

	div.mouseenter(E2.app.onSlotEntered(parent_node, s, div));
	div.mouseleave(E2.app.onSlotExited(parent_node, s, div));
	div.mousedown(E2.app.onSlotClicked(parent_node, s, div, type));

	dsc = 'Type: ' + s.dt.name;
	
	if(s.lo !== undefined || s.hi !== undefined)
		dsc += '\nRange: ' + (s.lo !== undefined ? 'min. ' + s.lo : '') + (s.hi !== undefined ? (s.lo !== undefined ? ', ' : '') + 'max. ' + s.hi : '')
	
	if(s.def !== undefined)
		dsc += '\nDefault: ' + s.def

	dsc += '<break>';
	
	if(s.desc)
		dsc += s.desc;

	div.attr('alt', dsc);
	div.hover(E2.app.onShowTooltip, E2.app.onHideTooltip);
	col.append(div);
};

NodeUI.render_slots = function(parent_node, nid, col, slots, type)
{
	for(var i = 0, len = slots.length; i < len; i++)
		NodeUI.create_slot(parent_node, nid, col, slots[i], type);
};

function Node(parent_graph, plugin_id, x, y)
{
	this.inputs = [];
	this.outputs = [];
	this.dyn_slot_uid = 0;
	this.queued_update = 0;
	
	if(plugin_id !== null) // Don't initialise if we're loading.
	{
		this.parent_graph = parent_graph;
		this.x = x;
		this.y = y;
		this.ui = null;
		this.id = E2.app.player.core.plugin_mgr.keybyid[plugin_id];
		this.uid = parent_graph.get_node_uid();
		this.update_count = 0;
		this.title = null;
		this.inputs_changed = false;
		
		this.set_plugin(E2.app.player.core.plugin_mgr.create(plugin_id, this));
	};
}

Node.prototype.set_plugin = function(plugin)
{
	this.plugin = plugin;
	this.plugin.updated = true;
	
	var init_slot = function(slot, index, type)
	{
		slot.index = index;
		slot.type = type;
		
		if(!slot.dt)
			msg('ERROR: The slot \'' + slot.name + '\' does not declare a datatype.');
	};
	
	// Decorate the slots with their index to make this immediately resolvable
	// from a slot reference, allowing for faster code elsewhere.
	// Additionally tagged with the type (0 = input, 1 = output) for similar reasons.
	for(var i = 0, len = plugin.input_slots.length; i < len; i++)
		init_slot(plugin.input_slots[i], i, E2.slot_type.input);
	
	for(var i = 0, len = plugin.output_slots.length; i < len; i++)
		init_slot(plugin.output_slots[i], i, E2.slot_type.output);
};
	
Node.prototype.create_ui = function()
{
	this.ui = new NodeUI(this, this.x, this.y);
};

Node.prototype.destroy_ui = function()
{
	if(this.ui)
	{
		this.ui.dom.hide();
		this.ui.dom.remove();
		this.ui = null;
	}
};

Node.prototype.destroy = function()
{
	var graph = this.parent_graph;
	var index = graph.nodes.indexOf(this);
	var pending = [];
	
	if(this.plugin.destroy)
		this.plugin.destroy();
	
	graph.emit_event({ type: 'node-destroyed', node: this });
	
	if(index != -1)
		graph.nodes.splice(index, 1);
	
	pending.push.apply(pending, this.inputs);
	pending.push.apply(pending, this.outputs);
	
	for(var i = 0, len = pending.length; i < len; i++)
		graph.destroy_connection(pending[i]);
	
	if(this.plugin.e2_is_graph)
	{
		// The parent dom element migt already be gone if we've nested in a parent
		// also being deleted.
		if(this.plugin.graph.tree_node.parent.ul)
			this.plugin.graph.tree_node.remove();
	}
	
	this.destroy_ui();
};

Node.prototype.get_disp_name = function()
{
	return this.title === null ? this.id : this.title;
};

Node.prototype.reset = function()
{
	var p = this.plugin;
	
	if(p.reset)
	{
		p.reset();
		p.updated = true;
	}
};

Node.prototype.add_slot = function(slot_type, def)
{
	var suid = this.dyn_slot_uid++;
	var is_inp = slot_type === E2.slot_type.input;
	def.uid = suid;
	
	if(is_inp)
	{
		if(!this.dyn_inputs)
			this.dyn_inputs = [];
		
		def.index = this.dyn_inputs.length;
		def.type = E2.slot_type.input;
		this.dyn_inputs.push(def);			
	}
	else
	{
		if(!this.dyn_outputs)
			this.dyn_outputs = [];
		
		def.index = this.dyn_outputs.length;
		def.type = E2.slot_type.output;
		this.dyn_outputs.push(def);			
	}
	
	if(this.ui)
	{
		var col = this.ui.dom.find(is_inp ? '#ic' : '#oc');
		
		NodeUI.create_slot(this, 'n' + this.uid, col, def, slot_type);
		this.update_connections();
	}
	
	return suid;
};

Node.prototype.remove_slot = function(slot_type, suid)
{
	var is_inp = slot_type === E2.slot_type.input;
	var slots = is_inp ? this.dyn_inputs : this.dyn_outputs;
	
	if(!slots)
		return;
	
	var slot = null;
	var idx = -1;
	
	for(var i = 0, len = slots.length; i < len; i++)
	{
		var s = slots[i];
		
		if(s.uid === suid)
		{
			slot = s;
			idx = i;
			slots.splice(i, 1)
			break;
		}
	} 
	
	if(!slot)
		return;
	
	if(slots.length < 1) // To prevent these to be serialised or allocated if all slots have been removed.
	{
		if(is_inp)
			this.dyn_inputs = undefined;
		else
			this.dyn_outputs = undefined;
	}
	else
	{
		// Patch up cached slot indices.
		for(var i = 0, len = slots.length; i < len; i++)
		{
			var s = slots[i];
		
			if(s.index > idx)
				s.index--;
		}
	}
	
	// Although impossible now, conceivably a plugin could create or destroy slots
	// in response to a clicked button on its control surface or something similar.
	if(this.ui)
		this.ui.dom.find('#n' + this.uid + (is_inp ? 'di' : 'do') + slot.uid).remove();
	
	var att = is_inp ? this.inputs : this.outputs;
	var pending = [];
	var canvas_dirty = false;
	
	for(var i = 0, len = att.length; i < len; i++)
	{
		var c = att[i];
		var s = is_inp ? c.dst_slot : c.src_slot;
	
		if(s === slot)
		{
			pending.push(c);
			
			if(c.ui)
				canvas_dirty = true;
		}
		else if(s.uid !== undefined && s.index > idx)
		{
			if(c.ui)
			{
				if(is_inp)
					c.ui.dst_pos = E2.app.getSlotPosition(c.ui.dst_slot_div, E2.slot_type.input);
				else
					c.ui.src_pos = E2.app.getSlotPosition(c.ui.src_slot_div, E2.slot_type.output);
				
				canvas_dirty = true;
			}
		}
	}
	
	for(var i = 0, len = pending.length; i < len; i++)
	{
		pending[i].signal_change(false);
		this.parent_graph.destroy_connection(pending[i]);
	}
		
	if(canvas_dirty)
		E2.app.updateCanvas(true);
};


Node.prototype.find_dynamic_slot = function(slot_type, suid)
{
	var slots = (slot_type === E2.slot_type.input) ? this.dyn_inputs : this.dyn_outputs;
	
	if(slots)
	{
		for(var i = 0, len = slots.length; i < len; i++)
		{
			if(slots[i].uid === suid)
				return slots[i];
		}
	}

	return null;
};

Node.prototype.rename_slot = function(slot_type, suid, name)
{
	var slot = this.find_dynamic_slot(slot_type, suid);
	
	if(slot)
	{
		slot.name = name;

		if(this.ui)
			this.ui.dom.find('#n' + this.uid + (is_inp ? 'di' : 'do') + slot.uid).text(name);
	}
};
	
Node.prototype.change_slot_datatype = function(slot_type, suid, dt)
{
	var slot = this.find_dynamic_slot(slot_type, suid);
	
	if(slot)
	{
	}
};

Node.prototype.update_connections = function()
{
	var gsp = E2.app.getSlotPosition;
	
	for(var i = 0, len = this.outputs.length; i < len; i++)
	{
		var c = this.outputs[i];
		
		c.ui.src_pos = gsp(c.ui.src_slot_div, E2.slot_type.output);
	}
	
	for(var i = 0, len = this.inputs.length; i < len; i++)
	{
		var c = this.inputs[i];
		
		c.ui.dst_pos = gsp(c.ui.dst_slot_div, E2.slot_type.input);
	}
	
	return this.inputs.length + this.outputs.length;
};

Node.prototype.update_recursive = function(conns, delta_t)
{
	var dirty = false;

	if(this.update_count < 1)
	{
		var inputs = this.inputs;
		var needs_update = this.inputs_changed;
		var s_plugin = this.plugin;
	
		for(var i = 0, len = inputs.length; i < len; i++)
		{
			var inp = inputs[i];
			var sn = inp.src_node;
			 
			dirty = sn.update_recursive(conns, delta_t) || dirty;
		
			var value = sn.plugin.update_output(inp.src_slot);
		
			if(sn.plugin.updated)
			{
				if(!sn.plugin.query_output || sn.plugin.query_output(inp.src_slot))
				{
					s_plugin.update_input(inp.dst_slot, value);
					s_plugin.updated = true;
					needs_update = true;
			
					if(inp.ui && !inp.ui.flow)
					{
						dirty = true;
						inp.ui.flow = true;
					}
				}
			}
			else if(inp.ui && inp.ui.flow)
			{
				inp.ui.flow = false;
				dirty = true;
			}
		}
	
		if(this.plugin.e2_is_graph)
		{
			s_plugin.update_state(delta_t);
		}			
		else if(this.queued_update > 0)
		{
			if(s_plugin.update_state)
				s_plugin.update_state(delta_t);

			this.plugin.updated = true;
			this.queued_update = 0;
		}
		else if(needs_update || (s_plugin.output_slots.length === 0 && (!this.outputs || this.outputs.length === 0)))
		{
			if(s_plugin.update_state)
				s_plugin.update_state(delta_t);
		
			this.inputs_changed = false;
		}
		else if(s_plugin.input_slots.length === 0 && (!this.inputs || this.inputs.length === 0))
		{
			if(s_plugin.update_state)
				s_plugin.update_state(delta_t);
		}
	}
	
	this.update_count++;

	return dirty;
};

Node.prototype.serialise = function()
{
	var d = {};
	
	d.plugin = this.plugin.id;
	d.x = Math.round(this.x);
	d.y = Math.round(this.y);
	d.uid = this.uid;
	
	if(this.dyn_slot_uid)
		d.dsid = this.dyn_slot_uid;
	
	if(this.plugin.state)
		d.state = this.plugin.state;

	if(this.title)
		d.title = this.title;
	
	if(this.plugin.e2_is_graph)
		d.graph = this.plugin.graph.serialise();
	
	if(this.dyn_inputs || this.dyn_outputs)
	{
		var pack_dt = function(slots)
		{
			for(var i = 0, len = slots.length; i < len; i++)
				slots[i].dt = slots[i].dt.id;
		};
		
		if(this.dyn_inputs)
		{
			d.dyn_in = clone(this.dyn_inputs);
			pack_dt(d.dyn_in);
		}
		
		if(this.dyn_outputs)
		{
			d.dyn_out = clone(this.dyn_outputs);
			pack_dt(d.dyn_out);
		}
	}

	return d;
};

Node.prototype.deserialise = function(guid, d)
{
	this.parent_graph = guid;
	this.x = d.x;
	this.y = d.y;
	this.id = E2.app.player.core.plugin_mgr.keybyid[d.plugin];
	this.uid = d.uid;
	
	if(d.dsid)
		this.dyn_slot_uid = d.dsid;
	
	this.title = d.title ? d.title : null;
	
	this.set_plugin(E2.app.player.core.plugin_mgr.create(d.plugin, this));
	
	if(this.plugin.e2_is_graph)
	{
		this.plugin.graph = new Graph(E2.app.player.core, null, null);
		this.plugin.graph.plugin = this.plugin;
		this.plugin.graph.deserialise(d.graph);
		this.plugin.graph.reg_listener(this.plugin.graph_event(this.plugin));
		E2.app.player.core.graphs.push(this.plugin.graph);
	}
	
	if(d.state)
		this.plugin.state = d.state;
	
	if(d.dyn_in || d.dyn_out)
	{
		var patch_slot = function(slots, type)
		{
			var rdt = E2.app.player.core.resolve_dt;
			
			for(var i = 0, len = slots.length; i < len; i++)
			{
				var s = slots[i];
				 
				s.dt = rdt[s.dt];
				s.type = type;
			}
		};
		
		if(d.dyn_in)
		{
			this.dyn_inputs = d.dyn_in;
			patch_slot(this.dyn_inputs, E2.slot_type.input);
		}
		
		if(d.dyn_out)
		{
			this.dyn_outputs = d.dyn_out;
			patch_slot(this.dyn_outputs, E2.slot_type.output);
		}
	}
};

Node.prototype.patch_up = function(graphs)
{
	this.parent_graph = resolve_graph(graphs, this.parent_graph);

	if(this.plugin.e2_is_graph)
		this.plugin.graph.patch_up(graphs);
};

Node.prototype.initialise = function()
{
	if(this.plugin.state_changed)
		this.plugin.state_changed(null);

	if(this.plugin.e2_is_graph)
		this.plugin.graph.initialise();
};
	
function Graph(core, parent_graph, tree_node) 
{
	this.tree_node = tree_node;
	this.listeners = [];
	this.nodes = [];
	this.connections = [];
	this.core = core;
	this.registers = {};
	if(tree_node !== null) // Only initialise if we're not deserialising.
	{
		this.uid = this.core.get_graph_uid();
		this.parent_graph = parent_graph;
		this.roots = [];
		this.children = [];
		this.node_uid = 0;
			
		tree_node.graph = this;
	}
}

Graph.prototype.get_node_uid = function()
{
	return this.node_uid++;
};

Graph.prototype.register_node = function(n)
{
	this.nodes.push(n);
	
	if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
		this.roots.push(n);
	else if(n.plugin.e2_is_graph)
		this.children.push(n);
};

Graph.prototype.unregister_node = function(n)
{
	this.nodes.remove(n);
	
	if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
		this.roots.remove(n);
	else if(n.plugin.e2_is_graph)
		this.children.remove(n);
};

Graph.prototype.create_instance = function(plugin_id, x, y)
{
	n = new Node(this, plugin_id, x, y);
	
	this.register_node(n);
	this.emit_event({ type: 'node-created', node: n });

	return n;
};

Graph.prototype.update = function(delta_t)
{
	var nodes = this.nodes;
	var roots = this.roots;
	var children = this.children;
	var dirty = false;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].update_count = 0;
	
	for(var i = 0, len = roots.length; i < len; i++)
		dirty = roots[i].update_recursive(this.connections, delta_t) || dirty;
	
	for(var i = 0, len = children.length; i < len; i++)
	{
		var c = children[i];
		
		if(!c.plugin.texture)
			dirty = c.update_recursive(this.connections, delta_t) || dirty;
	}

	if(this === E2.app.player.core.active_graph)
		E2.app.player.core.active_graph_dirty = dirty;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].plugin.updated = false;
	
	return dirty;
};

Graph.prototype.enum_all = function(n_delegate, c_delegate)
{
	if(n_delegate)
	{
		var nodes = this.nodes;
		    
		for(var i = 0, len = nodes.length; i < len; i++)
			n_delegate(nodes[i]);
	}

	if(c_delegate)
	{
		var conns = this.connections;
	    
		for(var i = 0, len = conns.length; i < len; i++)
			c_delegate(conns[i]);
	}
};

Graph.prototype.reset = function()
{
	this.enum_all(function(n)
	{
		n.reset();
	},
	function(c)
	{
		c.reset();
	});
};

Graph.prototype.play = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.play)
			n.plugin.play();
	}, null);
};

Graph.prototype.pause = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.pause)
			n.plugin.pause();
	}, null);
};

Graph.prototype.stop = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.stop)
			n.plugin.stop();
	}, null);
};

Graph.prototype.destroy_connection = function(c)
{
	var index = this.connections.indexOf(c);
	
	if(index !== -1)
		this.connections.splice(index, 1);
	
	c.dst_slot.is_connected = false;
	
	var slots = c.dst_node.inputs;
	
	index = slots.indexOf(c);

	if(index !== -1)
		slots.splice(index, 1);

	slots = c.src_node.outputs;
	index = slots.indexOf(c);

	if(index !== -1)
		slots.splice(index, 1);
};

Graph.prototype.create_ui = function()
{
	this.enum_all(function(n)
	{
		n.create_ui();

		if(n.ui && n.plugin.state_changed)
			n.plugin.state_changed(n.ui.plugin_ui);
	},
	function(c)
	{
		c.create_ui();
		c.ui.resolve_slot_divs();
	});
};

Graph.prototype.destroy_ui = function()
{
	this.enum_all(function(n) { n.destroy_ui(); }, function(c) { c.destroy_ui(); });
};

Graph.prototype.find_connections_from = function(node, slot)
{
	if(slot.type !== E2.slot_type.output)
		return [];
	
	var conns = this.connections;
	var uid = node.uid;
	var result = [];
	
	for(var i = 0, len = conns.length; i < len; i++)
	{
		var c = conns[i];
		
		if(c.src_node.uid === uid && c.src_slot === slot)
			result.push(c);			
	}
	
	return result;
};

Graph.prototype.lock_register = function(node, name)
{
	if(!this.registers.hasOwnProperty(name))
		this.registers[name] = { dt: E2.app.player.core.datatypes.ANY, value: null, readers: [], ref_count: 1 };
	else
		this.registers[name].ref_count++;
	
	var readers = this.registers[name].readers;
	
	if(node && readers.indexOf(node) === -1)
		readers.push(node);
};

Graph.prototype.unlock_register = function(node, name)
{
	if(this.registers.hasOwnProperty(name))
	{
		if(--this.registers[name].ref_count === 0)
			delete this.registers[name];
	}

	var readers = this.registers[name].readers;
	
	if(node && readers.indexOf(node) !== -1)
		readers.remove(node);
};

Graph.prototype.write_register = function(name, value)
{
	var reg = this.registers[name];
	
	reg.value = value;
	
	for(var i = 0, len = reg.readers.length; i < len; i++)
		reg.readers[i].plugin.register_value_updated(reg.value);
};

Graph.prototype.serialise = function()
{
	var d = {};
	
	d.node_uid = this.node_uid;
	d.uid = this.uid;
	d.parent_uid = this.parent_graph ? this.parent_graph.uid : -1;
	d.open = this.tree_node.isExpanded();
	d.nodes = [];
	d.conns = [];
	
	this.enum_all(function(n) { d.nodes.push(n.serialise()); }, function(c) { d.conns.push(c.serialise()); });

	return d;
};

Graph.prototype.deserialise = function(d)
{
	this.node_uid = d.node_uid;
	this.uid = d.uid;
	this.parent_graph = d.parent_uid;
			
	this.nodes = [];
	this.roots = [];
	this.children = [];
	this.open = d.open || false;
	
	for(var i = 0, len = d.nodes.length; i < len; i++)
	{
		var n = new Node(null, null, null, null);
		
		n.deserialise(this.uid, d.nodes[i]);
		this.register_node(n);
	}

	this.connections = [];

	for(var i = 0, len = d.conns.length; i < len; i++)
	{
		var c = new Connection(null, null, null, null);
		
		c.deserialise(d.conns[i]);
		this.connections.push(c);
	}
};

Graph.prototype.patch_up = function(graphs)
{
	this.parent_graph = resolve_graph(graphs, this.parent_graph);

	// Cannot use enum_all for this!
	var nodes = this.nodes,
	    conns = this.connections;
	    
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].patch_up(graphs);

	prune = [];
	
	for(var i = 0, len = conns.length; i < len; i++)
	{
		var c = conns[i];
		
		if(!c.patch_up(this.nodes))
			prune.push(c);
	}
	
	for(var i = 0, len = prune.length; i < len; i++)
		conns.remove(prune[i]);
};

Graph.prototype.initialise = function()
{
	var nodes = this.nodes;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].initialise();

	this.reset();
};

Graph.prototype.reg_listener = function(delegate)
{
	if(!this.listeners.indexOf(delegate) !== -1)
		this.listeners.push(delegate);
};

Graph.prototype.emit_event = function(ev)
{
	var l = this.listeners,
	    len = l.length;
	
	if(len === 0)
		return;
	
	for(var i = 0; i < len; i++)
		l[i](ev);
};
	
Graph.prototype.build_breadcrumb = function(parent, add_handler)
{
	var sp = $('<span>' + this.tree_node.data.title + '</span>');
	
	sp.css('cursor', 'pointer');
	
	if(add_handler)
	{
		sp.click(function(self) { return function()
		{
			self.tree_node.activate();
		}}(this));
		
		sp.css({ 'text-decoration': 'underline' });
	}
	
	parent.prepend($('<span> / </span>'));
	parent.prepend(sp);
	
	if(this.parent_graph)
		this.parent_graph.build_breadcrumb(parent, true);
};

Graph.prototype.reorder_children = function(node, src, hit_mode)
{
	var nn = node.graph.plugin.parent_node;
	var sn = src.graph.plugin.parent_node;
	
	var reorder = function(arr)
	{
		arr.remove(sn);
		
		var i = arr.indexOf(nn);
		
		if(hit_mode === 'after')
			i++;
		
		arr.splice(i, 0, sn);
	};
	
	// We have to reorder the .nodes array too, since the .children array is not persisted and
	// is rebuilt from .nodes during deserialization.
	reorder(this.children, node, src, hit_mode);
	reorder(this.nodes, node, src, hit_mode);
};

function Core(app) {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' },
		MATRIX: { id: 4, name: 'Matrix' },
		VECTOR: { id: 5, name: 'Vector' },
		CAMERA: { id: 6, name: 'Camera' },
		BOOL: { id: 7, name: 'Boolean' },
		ANY: { id: 8, name: 'Arbitrary' },
		MESH: { id: 9, name: 'Mesh' },
		AUDIO: { id: 10, name: 'Audio' },
		SCENE: { id: 11, name: 'Scene' },
		MATERIAL: { id: 12, name: 'Material' },
		LIGHT: { id: 13, name: 'Light' },
		DELEGATE: { id: 14, name: 'Delegate' },
		TEXT: { id: 15, name: 'Text' }
	};
	
	this.renderer = new Renderer('#webgl-canvas');
	this.active_graph = this.root_graph = null;
	this.active_graph_dirty = true;
	this.graphs = [];
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = 0;
	this.app = app;
	this.plugin_mgr = new PluginManager(this, 'plugins', E2.app ? E2.app.onPluginInstantiated : null);
	
	this.resolve_dt = []; // Make a table for easy reverse lookup of dt reference by id.
	
	for(var i in this.datatypes)
	{
		var dt = this.datatypes[i];
		
		this.resolve_dt[dt.id] = dt;
	}
	
	this.get_graph_uid = function()
	{
		return self.graph_uid++;
	};
	
	this.update = function(abs_t, delta_t)
	{
		self.abs_t = abs_t;
		self.delta_t = delta_t;
		
		self.renderer.begin_frame();
		self.root_graph.update(delta_t);
		self.renderer.end_frame();
				
		var dirty = self.active_graph_dirty;
				
		self.active_graph_dirty = false;
				
		return dirty; // Did connection state change?
	};
	
	this.onGraphSelected = function(graph)
	{
		self.active_graph.destroy_ui();
		self.active_graph = graph;
		
		// TODO: Fix this up later. We need to reset this position to make
		// copy / paste and switching graphs more humane, but right now this 
		// introduces a bug in the connection rendering logic for some (copied)
		// nested subgraphs.
		
		/*E2.dom.canvas_parent.scrollTop(0);
		E2.dom.canvas_parent.scrollLeft(0);
		self.scrollOffset = [0, 0];*/
		
		// Clear the current breadcrumb elements and rebuild.
		E2.dom.breadcrumb.children().remove();
		self.active_graph.build_breadcrumb(E2.dom.breadcrumb, false);
		
		self.active_graph.create_ui();
		self.active_graph.reset();
	};
	
	this.get_default_value = function(dt)
	{
		var dts = self.datatypes;
		
		if(dt === dts.FLOAT)
			return 0.0;
		else if(dt === dts.COLOR)
			return new Color(1, 1, 1);
		else if(dt === dts.MATRIX)
		{
			var m = mat4.create();
	
			mat4.identity(m);
			return m;
		}
		else if(dt === dts.VECTOR)
			return [0.0, 0.0, 0.0];
		else if(dt === dts.CAMERA)
			return new Camera(self.renderer.context);
		else if(dt === dts.BOOL)
			return false;
		else if(dt === dts.MATERIAL)
			return new Material();
		else if(dt === dts.TEXT)
			return '';
		
		// Shaders and textures legally default to null.
		return null;
	};
	
	this.serialise = function(minify)
	{
		var d = {};
		
		d.abs_t = Math.round(self.abs_t * Math.pow(10, 4)) / Math.pow(10, 4);
		d.active_graph = self.active_graph.uid;
		d.graph_uid = self.graph_uid;
		d.root = self.root_graph.serialise();
		
		return minify ? JSON.stringify(d) : JSON.stringify(d, undefined, 4);
	};
	
	this.deserialise = function(str)
	{
		var d = JSON.parse(str);
		
		self.abs_t = d.abs_t;
		self.delta_t = 0.0;
		self.graph_uid = d.graph_uid;

		self.active_graph.destroy_ui();
		
		var graphs = self.graphs = [];
		
		self.root_graph = new Graph(this, null, null);
		self.root_graph.deserialise(d.root);
		self.graphs.push(self.root_graph);
		self.root_graph.patch_up(self.graphs);
		self.root_graph.initialise(self.graphs);
			
		self.active_graph = resolve_graph(self.graphs, d.active_graph); 
		
		if(E2.dom.structure)
		{
			self.rebuild_structure_tree();
			self.active_graph.tree_node.activate();
		}
	};
	
	this.rebuild_structure_tree = function()
	{
		E2.dom.structure.dynatree('getRoot').removeChildren();
		var build = function(graph, name)
		{
			var nodes = graph.nodes;
			var pnode = graph.parent_graph !== null ? graph.parent_graph.tree_node : E2.dom.structure.dynatree('getRoot');
			var tnode = pnode.addChild({
				title: name,
				isFolder: true,
				expand: graph.open
			});
			
			graph.tree_node = tnode;
			tnode.graph = graph;
			
			for(var i = 0, len = nodes.length; i < len; i++)
			{
				var n = nodes[i];
				
				if(n.plugin.e2_is_graph)
					build(n.plugin.graph, n.get_disp_name());
			}
		};
		
		build(self.root_graph, 'Root');
	};
}

function Application() {
	var self = this;
	var canvas_parent = $("#canvas_parent");
	var canvas = $("#canvas");
		
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.snippet_mgr = new SnippetManager('snippets');
	this.player = null;
	this.canvas = canvas;
	this.c2d = canvas[0].getContext('2d');
	this.src_node = null;
	this.dst_node = null;
	this.src_slot = null;
	this.src_slot_div = null;
	this.dst_slot = null;
	this.dst_slot_div = null;
	this.edit_conn = null;
	this.shift_pressed = false;
	this.ctrl_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hover_node = null;
	this.hover_nodes = [];
	this.scrollOffset = [0, 0];
	this.selection_start = null;
	this.selection_end = null;
	this.selection_last = null;
	this.selection_nodes = [];
	this.selection_conns = [];
	this.selection_dom = null;
	this.clipboard = null;
	this.in_drag = false;
	this.resize_timer = null;
	
	this.getNIDFromSlot = function(id)
	{
		return parseInt(id.slice(1, id.indexOf('s')));
	};
	
	this.getSIDFromSlot = function(id)
	{
		return parseInt(id.slice(id.indexOf('s') + 2, id.length));
	};
	
	this.offsetToCanvasCoord = function(ofs)
	{
		var o = [ofs.left, ofs.top];
		var co = canvas_parent.offset();
		var so = self.scrollOffset;
		
		o[0] -= co.left;
		o[1] -= co.top;
		o[0] += so[0];
		o[1] += so[1];
		
		return o;
	};
	
	this.getSlotPosition = function(slot_div, type)
	{
		var o = self.offsetToCanvasCoord(slot_div.offset());
		var x = type == E2.slot_type.input ? o[0] : o[0] + slot_div.width();
		
		return [Math.round(x), Math.round(o[1] + (slot_div.height() / 2))];
	};
	
	this.onPluginInstantiated = function(id, pos)
	{	
		var cp = canvas_parent;
		var co = cp.offset();
		var createPlugin = function(name)
		{
			var node = self.player.core.active_graph.create_instance(id, (pos[0] - co.left) + self.scrollOffset[0], (pos[1] - co.top) + self.scrollOffset[1]);
		
			node.reset();

			if(name !== null) // Graph?
			{
				node.title = name;
				node.plugin.graph = new Graph(self.player.core, node.parent_graph, node.parent_graph.tree_node.addChild({
					title: name,
					isFolder: true,
					expand: true
				}));
				
				node.plugin.graph.plugin = node.plugin;
				node.plugin.graph.reg_listener(node.plugin.graph_event(node.plugin));
				self.player.core.graphs.push(node.plugin.graph);
			}
			
			node.create_ui();
			
			if(node.plugin.state_changed)
			{
				node.plugin.state_changed(null);			
				node.plugin.state_changed(node.ui.plugin_ui);			
			}
		};
		
		if(id === 'graph')
		{
			var diag = make('div');
			var inp = $('<input type="input" value="graph(' + self.player.core.active_graph.node_uid + ')" />'); 
		
			inp.css('width', '410px');
			diag.append(inp);
		
			diag.dialog({
				width: 460,
				height: 150,
				modal: true,
				title: 'Name new graph.',
				show: 'slide',
				hide: 'slide',
				buttons: {
					'OK': function()
					{
						createPlugin(inp.val());
						$(this).dialog('close');
					},
					'Cancel': function()
					{
						$(this).dialog('close');
					}
				},
				open: function()
				{
					inp.focus().select();
					diag.keyup(function(e)
					{
						if(e.keyCode === $.ui.keyCode.ENTER)
						{
							createPlugin(inp.val());
							diag.dialog('close');
						}
					});
				}
			});
		}
		else
			createPlugin(null);
	};
	
	this.onSlotClicked = function(node, slot, slot_div, type) { return function(e)
	{
		e.stopPropagation();
		
		if(!self.shift_pressed && type == E2.slot_type.output)
		{
			self.set_persist_select(false);

			self.src_node = node;
			self.src_slot = slot;
			self.src_slot_div = slot_div;
			self.edit_conn = new Connection(null, null, null, null);
			self.edit_conn.create_ui();
			self.edit_conn.ui.src_pos = self.getSlotPosition(slot_div, E2.slot_type.output);
		
			var graph = self.player.core.active_graph;
			var ocs = graph.find_connections_from(node, slot);
			var offset = 0;
			
			ocs.sort(function(a, b) {
				return a.offset < b.offset ? - 1 : a.offset > b.offset ? 1 : 0;
			});
			
			for(var i = 0, len = ocs.length; i < len; i++)
			{
				var oc = ocs[i];
				
				oc.offset = i;

				if(oc.offset != i)
				{
					offset = i;
					break;
				}
				
				offset = i + 1;
			}
			
			self.edit_conn.offset = offset;
			slot_div[0].style.color = '#0f0';
		}
		
		if(self.shift_pressed)
			self.removeHoverConnections();
				
		return false;
	}};

	this.activateHoverSlot = function()
	{
		var hs = self.hover_slot;
		
		if(!hs)
			return;
		
		self.hover_slot_div[0].style.backgroundColor = E2.erase_color;
		
		// Mark any attached connection
		var conns = self.player.core.active_graph.connections;
		var dirty = false;
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			if(c.dst_slot === hs || c.src_slot === hs)
			{
				c.ui.deleting = true;
				self.hover_connections.push(c);
				dirty = true;
								
				if(hs.type == E2.slot_type.input)
					break; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
			}
		}
		
		if(dirty)
			self.updateCanvas(false);
	};
	
	this.releaseHoverSlot = function()
	{
		if(self.hover_slot != null)
		{
			self.hover_slot_div[0].style.backgroundColor = 'inherit';
			self.hover_slot_div = null;
			self.hover_slot = null;
		}
		
		self.releaseHoverConnections();
		
		if(self.dst_slot_div != null)
		{
			self.dst_slot_div[0].style.color = '#000';
			self.dst_slot_div = null;
		}

	};
	
	this.onSlotEntered = function(node, slot, slot_div) { return function(e)
	{
		if(self.src_slot)
		{
			var any_dt = self.player.core.datatypes.ANY;
			self.dst_slot_div = slot_div;
			
			var ss_dt = self.src_slot_div.definition.dt;
			
			// Only allow connection if datatypes match and slot is unconnected. 
			// Don't allow self-connections. There no complete check for cyclic 
			// redundacies, though we should probably institute one.
			// Additionally, don't allow connections between two ANY slots.
			if(slot.type === E2.slot_type.input && 
			    (ss_dt === any_dt || 
			     slot.dt === any_dt || 
			     ss_dt === slot.dt) && 
			   !(ss_dt === any_dt && slot.dt === any_dt) &&
			   !slot.is_connected && 
			   self.src_node !== node)
			{
				self.dst_node = node;
				self.dst_slot = slot;
				slot_div[0].style.color = '#0f0';
			}
			else
			{
				self.dst_node = null;
				self.dst_slot = null;
				slot_div[0].style.color = E2.erase_color;
			}
		}
		
		self.hover_slot = slot;
		self.hover_slot_div = slot_div;

		if(self.shift_pressed)
			self.activateHoverSlot();
	}};

	this.onSlotExited = function(node, slot, slot_div) { return function(e)
	{
		if(self.dst_node === node)
			self.dst_node = null;
		
		if(self.dst_slot === slot)
			self.dst_slot = null;
			
		self.releaseHoverSlot();
	}};
	
	this.updateCanvas = function(clear)
	{
		var c = self.c2d;
		var canvas = self.canvas[0];
		 
		if(clear)
			c.clearRect(0, 0, canvas.width, canvas.height);
				
		var conns = self.player.core.active_graph.connections;
		var cb = [[], [], [], []];
		var styles = ['#888', '#000', '#09f', E2.erase_color];
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var cui = conns[i].ui;

			// Draw inactive connections first, then connections with data flow,
			// next selected connections and finally selected connections to 
			// ensure they get rendered on top.
			cb[cui.deleting ? 3 : cui.selected ? 2 : cui.flow ? 1 : 0].push(cui.parent_conn);
		}
		
		if(self.edit_conn)
			cb[0].push(self.edit_conn);
		
		var so = self.scrollOffset;
		
		c.lineWidth = 1; // Doesn't work in Chrome with lineWidth > 1 :(
		c.lineCap = 'square';
		c.lineJoin = 'miter';
		
		for(var bin = 0; bin < 4; bin++)
		{
			var b = cb[bin];

			if(b.length > 0)
			{
				c.strokeStyle = styles[bin];
				c.beginPath();
			
				for(var i = 0, len = b.length; i < len; i++)
				{
					var conn = b[i],
					    cui = conn.ui,
					    x1 = (cui.src_pos[0] - so[0]) + 0.5,
					    y1 = (cui.src_pos[1] - so[1]) + 0.5,
					    x4 = (cui.dst_pos[0] - so[0]) + 0.5,
					    y4 = (cui.dst_pos[1] - so[1]) + 0.5,
					    mx = (x1 + x4) / 2,
					    my = (y1 + y4) / 2,
					    x2 = x1 + 10 + (conn.offset * 5);
		
					x2 = x2 < mx ? x2 : mx;
					
					c.moveTo(x1, y1);
					c.lineTo(x2, y1);
					c.lineTo(x2, y4);
					c.lineTo(x4, y4);
				}
				
				c.stroke()
			}
		}
		
		// Draw selection fence (if any)
		if(self.selection_start)
		{
			var ss = self.selection_start;
			var se = self.selection_end;
			var so = self.scrollOffset;
			var s = [ss[0] - so[0], ss[1] - so[1]];
			var e = [se[0] - so[0], se[1] - so[1]];
			
			c.lineWidth = 2;
			c.strokeStyle = '#000';
			c.strokeRect(s[0], s[1], e[0] - s[0], e[1] - s[1]);
		}
	};
	
	this.mouseEventPosToCanvasCoord = function(e)
	{
		var cp = canvas_parent[0];
		
		return [(e.pageX - cp.offsetLeft) + self.scrollOffset[0], (e.pageY - cp.offsetTop) + self.scrollOffset[1]];
	};
	
	this.onMouseMoved = function(e)
	{
		if(self.src_slot)
		{
			var cp = E2.dom.canvas_parent;
			var pos = cp.position();
			var w = cp.width();
			var h = cp.height();
			var x2 = pos.left + w;
			var y2 = pos.top + h;
			
			if(e.pageX < pos.left)
				cp.scrollLeft(self.scrollOffset[0] - 20);
			else if(e.pageX > x2)
				cp.scrollLeft(self.scrollOffset[0] + 20);
					
			if(e.pageY < pos.top)
				cp.scrollTop(self.scrollOffset[1] - 20);
			else if(e.pageY > y2)
				cp.scrollTop(self.scrollOffset[1] + 20);

			self.edit_conn.ui.dst_pos = self.mouseEventPosToCanvasCoord(e);
			self.updateCanvas(true);
		}
	};
	
	this.onMouseReleased = function(e)
	{
		if(self.dst_node && self.dst_slot) // If dest_slot is set, we should create a permanent connection.
		{
			var ss = self.src_slot;
			var ds = self.dst_slot;
			var c = new Connection(self.src_node, self.dst_node, ss, ds);
			
			self.src_node.outputs.push(c);
			self.dst_node.inputs.push(c);
			
			// msg('New ' + c);

			c.create_ui();
			c.ui.src_pos = self.edit_conn.ui.src_pos.slice(0);
			c.ui.dst_pos = self.getSlotPosition(self.dst_slot_div, E2.slot_type.input);
			c.ui.src_slot_div = self.src_slot_div;
			c.ui.dst_slot_div = self.dst_slot_div;
			c.offset = self.edit_conn.offset;
			
			var graph = self.player.core.active_graph; 
			
			graph.connections.push(c);
			
			c.signal_change(true);

			self.dst_slot_div[0].style.color = '#000';
			self.dst_slot.is_connected = true;
			self.dst_slot_div = null;
			self.dst_slot = null;
		}

		if(self.src_slot)
		{
			self.src_slot_div[0].style.color = '#000';
			self.src_slot = null;
			self.src_slot_div = null;
			self.set_persist_select(true);
		}
		
		self.dst_node = null;
		self.src_node = null;
		self.edit_conn = null;
		self.updateCanvas(true);
	};
	
	this.activateHoverNode = function()
	{
		if(self.hover_node !== null)
		{
			self.hover_node.ui.header_row[0].style.backgroundColor = E2.erase_color;
		
			var hcs = self.hover_connections;
			var conns = self.player.core.active_graph.connections;
			
			var iterate_conns = function(hcs, uid)
			{
				for(var i = 0, len = conns.length; i < len; i++)
				{
					var c = conns[i];
				
					if(c.src_node.uid == uid || c.dst_node.uid == uid)
					{
						c.ui.deleting = true;
						hcs.push(c);
					}
				}
			};
			
			self.hover_nodes.push(self.hover_node);

			if(self.isNodeInSelection(self.hover_node))
			{
				var nodes = self.selection_nodes;
				
				for(var n = 0, len2 = nodes.length; n < len2; n++)
				{
					var node = nodes[n];

					if(node === self.hover_node)
						continue;

					node.ui.header_row[0].style.backgroundColor = E2.erase_color;
					self.hover_nodes.push(node);
					
					iterate_conns(hcs, node.uid);
				}
			}
			else
			{
				iterate_conns(hcs, self.hover_node.uid);
			}
			
			if(hcs.length > 0)
				self.updateCanvas(false);
		}
	};
	
	this.releaseHoverNode = function(release_conns)
	{
		if(self.hover_node !== null)
		{
			var hn = self.hover_nodes;
			
			self.hover_node = null;
			
			for(var i = 0, len = self.hover_nodes.length; i < len; i++)
				hn[i].ui.header_row[0].style.backgroundColor = '#656974'; // TODO: Ugly. This belongs in a style sheet.
			
			self.hover_nodes = [];
			
			if(release_conns)
				self.releaseHoverConnections();
		}
	};

	this.set_persist_select = function(on)
	{
		E2.dom.persist.attr('class', on ? 'selection_on' : 'selection_off');
	};
	
	this.clearEditState = function()
	{
		self.src_node = null;
		self.dst_node = null;
		self.src_slot = null;
		self.src_slot_div = null;
		self.dst_slot = null;
		self.dst_slot_div = null;
		self.edit_conn = null;
		self.shift_pressed = false;
		self.ctrl_pressed = false;
		self.hover_slot = null;
		self.hover_slot_div = null;
		self.hover_connections = [];
		self.hover_node = null;

		self.set_persist_select(true);
	};
	
	this.releaseHoverConnections = function()
	{
		var hcs = self.hover_connections;
		
		if(hcs.length > 0)
		{
			for(var i = 0, len = hcs.length; i < len; i++)
				hcs[i].ui.deleting = false;
			
			self.hover_connections = [];
			self.updateCanvas(false);
		}
		
	};
	
	this.removeHoverConnections = function()
	{
			var hcs = self.hover_connections;
		
			if(hcs.length > 0)
			{
				var graph = self.player.core.active_graph;
				var conns = graph.connections;
				
				// Remove the pending connections from the graph list,
				// so that plugins that rely on notification of graph
				// events can scan this list with meaningful results.
				for(var i = 0, len = hcs.length; i < len; i++)
				{
					var c = hcs[i];
					var idx = conns.indexOf(c);
					
					if(idx > -1)
						conns.splice(idx, 1);

					graph.destroy_connection(c);
				}
				
				for(var i = 0, len = hcs.length; i < len; i++)
					hcs[i].signal_change(false);
				
				self.hover_connections = [];
				self.updateCanvas(true);
			}
	};
		
	this.onNodeHeaderEntered = function(node) { return function(e)
	{
		self.hover_node = node;

		if(self.shift_pressed)
			self.activateHoverNode();
	}};
	
	this.onNodeHeaderExited = function(e)
	{
		self.releaseHoverNode(true);
		self.hover_node = null;
	};
	
	this.deleteHoverNodes = function()
	{
		var hns = self.hover_nodes.slice(0);
		var ag = self.player.core.active_graph;
		
		self.releaseHoverNode(false);
		self.clearSelection();

		self.removeHoverConnections();

		for(var i = 0, len = hns.length; i < len; i++)
		{
			var n = hns[i];
			
			ag.unregister_node(n);
			n.destroy();
		}
		
		self.updateCanvas(true);
	};
	
	this.onNodeHeaderClicked = function(e)
	{
		e.stopPropagation();
		
		if(self.shift_pressed && self.hover_node !== null)
		{
			self.deleteHoverNodes();
		}
		
		return false;
	};
	
	this.onNodeHeaderDblClicked = function(node) { return function(e)
	{
		var diag = make('div');
		var inp = $('<input type="input" value="' + (node.title === null ? node.id : node.title) + '" />'); 
	
		inp.css('width', '410px');
		diag.append(inp);
	
		var done_func = function()
		{
			node.title = inp.val();
		
			if(node.ui !== null)
			{
				node.ui.dom.find('#t').text(node.title);
				
				if(node.update_connections())
					E2.app.updateCanvas(true);
			}
			
			if(node.plugin.e2_is_graph)
				node.plugin.graph.tree_node.setTitle(node.title);
		
			if(node.plugin.renamed)
				node.plugin.renamed();
				
			node.parent_graph.emit_event({ type: 'node-renamed', node: node });
			diag.dialog('close');
		};
		
		diag.dialog({
			width: 460,
			height: 150,
			modal: true,
			title: 'Rename node.',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					done_func();
				},
				'Cancel': function()
				{
					diag.dialog('close');
				}
			},
			open: function()
			{
				inp.focus().select();
				diag.keyup(function(e)
				{
					if(e.keyCode === $.ui.keyCode.ENTER)
						done_func();
				});
			}
		});
	}};
	
	this.isNodeInSelection = function(node)
	{
		var sn = self.selection_nodes;
		 
		if(sn.length)
		{
			for(var i = 0, len = sn.length; i < len; i++)
			{
				if(sn[i] === node)
					return true;
			}
		}
		
		return false;
	};
	
	this.onNodeDragged = function(node) { return function(e)
	{
		self.in_drag = true;

		var nd = node.ui.dom[0];
		var dx = nd.offsetLeft - node.x;
		var dy = nd.offsetTop - node.y;
		
		node.x += dx;
		node.y += dy;
		
		
		var dirty = node.update_connections();
		
		if(self.isNodeInSelection(node))
		{
			var sn = self.selection_nodes;
			
			for(var i = 0, len = sn.length; i < len; i++)
			{
				var n = sn[i];
				
				if(n === node) // Already at the desired location
					continue;
				
				var s = n.ui.dom[0].style;
				
				n.x += dx;
				n.y += dy;
				s.left = '' + (n.x) + 'px';
				s.top = '' + (n.y) + 'px';
				dirty = n.update_connections() || dirty;
			}
		}
		
		if(dirty)
			self.updateCanvas(true);
	}};
	
	this.onNodeDragStopped = function(node) { return function(e)
	{
		self.onNodeDragged(node)(e);
		self.in_drag = false;
	}};
	
	this.clearSelection = function()
	{
		for(var i = 0, len = self.selection_nodes.length; i < len; i++)
		{
			var nui = self.selection_nodes[i].ui;
			
			if(nui) 
				nui.dom[0].style.border = '1px solid #aaa';
		}
			
		for(var i = 0, len = self.selection_conns.length; i < len; i++)
		{
			var cui = self.selection_conns[i].ui;
			
			if(cui) 
				cui.selected = false;
		}

		self.selection_nodes = [];
		self.selection_conns = [];
		
		// Clear the info view contents.
		E2.dom.info.html('');
	};
	
	this.onCanvasMouseDown = function(e)
	{
		if($(e.target).attr('id') !== 'canvas')
			return;
		
		if(e.which === 1)
		{
			self.set_persist_select(false);
			self.selection_start = self.mouseEventPosToCanvasCoord(e);
			self.selection_end = self.selection_start.slice(0);
			self.selection_last = [e.pageX, e.pageY];
			self.clearSelection();
			self.selection_dom = E2.dom.canvas_parent.find(':input').addClass('noselect'); //.attr('disabled', 'disabled');
		}
		else
		{
			self.releaseSelection();
			self.selection_nodes = [];
			self.selection_conns = [];
		}
		
		self.in_drag = true;
		self.updateCanvas(false);
	};
	
	this.releaseSelection = function()
	{
		self.selection_start = null;
		self.selection_end = null;
		self.selection_last = null;
		self.set_persist_select(true);
		
		if(self.selection_dom)
			self.selection_dom.removeClass('noselect'); // .removeAttr('disabled');
		
		self.selection_dom = null;
	};
	
	this.onCanvasMouseUp = function(e)
	{
		if(!self.selection_start)
			return;
		
		self.releaseSelection();
		
		var nodes = self.selection_nodes;
		
		if(nodes.length)
		{
			var sconns = self.selection_conns;
			
			var insert_all = function(clist)
			{
				for(var i = 0, len = clist.length; i < len; i++)
				{
					var c = clist[i];
					var found = false;
										
					for(var ci = 0, cl = sconns.length; ci < cl; ci++)
					{
						if(c === sconns[ci])
						{
							found = true;
							break;
						}
					}
			
					if(!found)
					{
						c.ui.selected = true;
						sconns.push(c);
					}
				}
			};
			
			// Select all pertinent connections
			for(var i = 0, len = nodes.length; i < len; i++)
			{
				var n = nodes[i];
			    				
				insert_all(n.inputs);
				insert_all(n.outputs);
			}
		}
		
		self.in_drag = false;
		self.updateCanvas(true);
	};

	this.onCanvasMouseMoved = function(e)
	{
		var ss = self.selection_start;

		if(!ss)
			return;

		var se = self.selection_end = self.mouseEventPosToCanvasCoord(e);
		var nodes = self.player.core.active_graph.nodes;
		var cp = E2.dom.canvas_parent;
		
		ss = ss.slice(0);
		se = se.slice(0);
		
		for(var i = 0; i < 2; i++)
		{
			if(se[i] < ss[i])
			{
				var t = ss[i];
			
				ss[i] = se[i];
				se[i] = t;
			}
		}
		
		var sn = self.selection_nodes;
		
		for(var i = 0, len = self.selection_nodes.length; i < len; i++)
			sn[i].ui.dom[0].style.border = '1px solid #aaa';

		self.selection_nodes = [];
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var n = nodes[i],
			    nui = n.ui.dom[0],
			    p_x = nui.offsetLeft,
			    p_y = nui.offsetTop,
			    p_x2 = p_x + nui.clientWidth,
			    p_y2 = p_y + nui.clientHeight;
			    
			if(se[0] < p_x || se[1] < p_y || ss[0] > p_x2 || ss[1] > p_y2)
				continue; // No intersection.
				
			n.ui.dom[0].style.border = '2px solid #09f';
			self.selection_nodes.push(n);
		}
		
		var co = cp.offset();
		var w = cp.width();
		var h = cp.height();
		var dx = e.pageX - self.selection_last[0];
		var dy = e.pageY - self.selection_last[1];

		if((dx < 0 && e.pageX < co.left + (w * 0.15)) || (dx > 0 && e.pageX > co.left + (w * 0.85)))
			cp.scrollLeft(self.scrollOffset[0] + dx);
		
		if((dy < 0 && e.pageY < co.top + (h * 0.15)) || (dy > 0 && e.pageY > co.top + (h * 0.85)))
			cp.scrollTop(self.scrollOffset[1] + dy);
		
		
		self.selection_last = [e.pageX, e.pageY];
		
		self.updateCanvas(true);
	};

	this.selectAll = function()
	{
		self.selection_nodes = [];
		self.selections_conns = [];
		
		
	};
	
	this.fillCopyBuffer = function(nodes, conns, sx, sy)
	{
		var d = {};
		var x1 = 9999999.0, y1 = 9999999.0, x2 = 0, y2 = 0;
		
		d.nodes = [];
		d.conns = [];
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var n = nodes[i];
			var dom = n.ui ? n.ui.dom : null;
			var p = dom ? dom.position() : { left: n.x, top: n.y };
			var b = [p.left, p.top, p.left + (dom ? dom.width() : 0), p.top + (dom ? dom.height() : 0)]; 
			
			if(dom)
				n = n.serialise();
			
			if(b[0] < x1) x1 = b[0];
			if(b[1] < y1) y1 = b[1];
			if(b[2] > x2) x2 = b[2];
			if(b[3] > y2) y2 = b[3];
			
			d.nodes.push(n);
		}
		
		d.x1 = x1 + sx;
		d.y1 = y1 + sy;
		d.x2 = x2 + sx;
		d.y2 = y2 + sy;
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			d.conns.push(c.ui ? c.serialise() : c);
		}
			
		self.clipboard = JSON.stringify(d);
		msg('Copy event. Buffer:');
		msg(self.clipboard);
	};
	
	this.onCopy = function(e)
	{
		if(e.target.id === 'persist')
			return true;
		
		if(self.selection_nodes.length < 1)
		{
			msg('Copy: Nothing selected.');
			e.stopPropagation();
			return false;
		}
		
		self.fillCopyBuffer(self.selection_nodes, self.selection_conns, self.scrollOffset[0], self.scrollOffset[1]);
		e.stopPropagation();
		return false;
	};
	
	this.onCut = function(e)
	{
		if(e.target.id === 'persist')
			return;

		msg('Cut event');
		
		if(self.selection_nodes.length > 0)
		{
			self.onCopy(e);
			self.hover_node = self.selection_nodes[0];
			self.activateHoverNode();
			self.deleteHoverNodes();
		}
	};

	this.onPaste = function(e)
	{
		if(e.target.id === 'persist')
			return;
		
		if(self.clipboard === null)
			return;
		
		self.clearSelection();
				
		var d = JSON.parse(self.clipboard);
		var cp = E2.dom.canvas_parent;
		var ag = self.player.core.active_graph;
		var n_lut = {};
		var sx = self.scrollOffset[0];
		var sy = self.scrollOffset[1];
		var w2 = cp.width() / 2.0;
		var h2 = cp.height() / 2.0;
		var bw2 = (d.x2 - d.x1) / 2.0;
		var bh2 = (d.y2 - d.y1) / 2.0;
		
		w2 -= bw2;
		h2 -= bh2;
		
		bw2 = sx + w2;
		bh2 = sy + h2;
		
		bw2 = bw2 < 0 ? 0 : bw2;
		bh2 = bh2 < 0 ? 0 : bh2;
		
		for(var i = 0, len = d.nodes.length; i < len; i++)
		{
			var node = d.nodes[i];
			
			var n = new Node(null, null, null, null);
			var new_uid = ag.get_node_uid();
				
			// Insert the pasted nodes in the center of the current view,
			// maintaining relative placement of the nodes.
			node.x = (node.x - d.x1) + bw2;
			node.y = (node.y - d.y1) + bh2;

			n.deserialise(ag.uid, node);
			
			n_lut[n.uid] = new_uid;
			n.uid = new_uid;
			
			ag.register_node(n);
			ag.emit_event({ type: 'node-created', node: n });

			n.patch_up(self.player.core.graphs);
			self.selection_nodes.push(n);
		}

		for(var i = 0, len = d.conns.length; i < len; i++)
		{
			var cn = d.conns[i];
			
			var suid = n_lut[cn.src_nuid];
			var duid = n_lut[cn.dst_nuid];
			
			if(suid === undefined || duid === undefined)
			{
				// We have to clear the the is_connected flag from the destination
				// slot. Otherwise the user will be unable to connect to it. 
				if(duid !== undefined)
				{
					for(var ni = 0, len2 = self.selection_nodes.length; ni < len2; ni++)
					{
						var n = self.selection_nodes[ni];
						
						if(n.uid === duid)
						{
							var slots = cn.dst_dyn ? n.dyn_inputs : n.plugin.input_slots;
							var slot = slots[cn.dst_slot];
							
							slot.is_connected = false;
							slot.connected = false;
							n.inputs_changed = true;
		
							// TODO: Does any of the graph internal state need clearing at this point?
							// Do we need to find a way to correctly call connection_changed() here?
							
							break; // Early out
						}
					}
				}
				
				continue;
			}
			
			var c = new Connection(null, null, null, null);

			c.deserialise(cn);
			
			c.src_node = suid;
			c.dst_node = duid;
			
			if(c.patch_up(ag.nodes))
			{
				ag.connections.push(c);

				c.create_ui();
				c.ui.selected = true;
				self.selection_conns.push(c);
			}
		}
		
		var r_init_struct = function(pg, n)
		{
			n.parent_graph = pg;
			
			if(!n.plugin.e2_is_graph)
				return;

			n.plugin.graph.tree_node = n.parent_graph.tree_node.addChild({
				title: n.title,
				isFolder: true,
				expand: true
			});
			
			n.plugin.graph.tree_node.graph = n.plugin.graph;
			n.plugin.graph.uid = E2.app.player.core.get_graph_uid();
			n.plugin.graph.parent_graph = pg;
		
			var nodes = n.plugin.graph.nodes;
			
			for(var i = 0, len = nodes.length; i < len; i++)
				r_init_struct(n.plugin.graph, nodes[i]);
		};
		
		for(var i = 0, len = self.selection_nodes.length; i < len; i++)
		{
			var n = self.selection_nodes[i];

			n.initialise();

			if(n.plugin.reset)
				n.plugin.reset();			

			n.create_ui();

			n.ui.dom[0].border = '2px solid #09f';

			if(n.plugin.state_changed)
				n.plugin.state_changed(n.ui.plugin_ui);			
			
			r_init_struct(ag, n);
		}
		
		for(var i = 0, len = self.selection_conns.length; i < len; i++)
			self.selection_conns[i].ui.resolve_slot_divs();
		
		if(d.conns.length)
			self.updateCanvas(false);
		
		msg('Paste event');
	};

	this.onWindowResize = function()
	{
		var win = $(window);
		var win_width = win.width();
		var win_height = win.height();
		var cont_h = E2.dom.controls.height();
		var info_w = E2.dom.info.width();
		var used_width = info_w + E2.dom.webgl_canvas.width();
		var used_height = cont_h + 250;
		var c_width = (win_width - used_width) - 35;
		var c_height = (win_height - used_height);
		var col1_x = info_w + 20;
		var col2_x = info_w + c_width + 27;
		var col2_y = cont_h + c_height;
		var col2_h = (win_height - (c_height + cont_h)) - 32;
		var tabs_h = (win_height - (cont_h + E2.dom.webgl_canvas.height())) - 32;
		
		E2.dom.breadcrumb.css({ 'position': 'absolute', 'left': col1_x + 8, 'top': cont_h +16 });
		E2.dom.canvas_parent.css({ 'position': 'absolute', 'left': col1_x });
		E2.dom.webgl_canvas.css({ 'left':  col2_x });
		E2.dom.tabs.css({ 'left':  col2_x, 'height': tabs_h });
		E2.dom.persist.css({ 'height': tabs_h - 100 });
		E2.dom.snippets_list.css({ 'height': tabs_h - 100 });
		E2.dom.structure.css({ 'height': c_height - 8 });
		E2.dom.info.css({ 'position': 'absolute', 'left': 0, 'top': col2_y, 'height': col2_h });
		E2.dom.dbg.css({ 'position': 'absolute', 'left': col1_x - 3, 'top': col2_y + 7, 'width': c_width - 4, 'height': col2_h });
		E2.dom.canvas_parent.css({ 'width': c_width, 'height': c_height });
		E2.dom.canvas.css({ 'width': c_width, 'height': c_height });
		
		// More hackery
		E2.dom.canvas[0].width = E2.dom.canvas.width();
		E2.dom.canvas[0].height = E2.dom.canvas.height();
		
		if(self.player)
			self.updateCanvas(true);
	};
	
	this.onKeyDown = function(e)
	{
		if(e.keyCode === 17) // CTRL
		{
			self.ctrl_pressed = true;
		}
		else if(e.keyCode === 16) // .isShift doesn't work on Chrome. This does.
		{
			self.shift_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
		else if(self.ctrl_pressed)
		{
			var tgt = e.target.tagName;
			
			if(tgt === 'INPUT' || tgt === 'TEXTAREA')
				return;
				
			if(e.keyCode === 67) // CTRL+c
				self.onCopy(e);
			else if(e.keyCode === 88) // CTRL+x
				self.onCut(e);
			else if(e.keyCode === 86) // CTRL+v
				self.onPaste(e);
		}
	};
	
	this.onKeyUp = function(e)
	{
		if(e.keyCode === 17) // CTRL
		{
			self.ctrl_pressed = false;
		}
		else if(e.keyCode === 16)
		{
			self.shift_pressed = false;
			self.releaseHoverSlot();
			self.releaseHoverNode(false);
		}
		else if(e.keyCode === 27)
		{
			self.player.core.renderer.set_fullscreen(false);
		}
	};

	this.changeControlState = function()
	{
		var s = self.player.state;
		var cs = self.player.current_state;
		
		E2.dom.play.button(cs == s.PLAYING ? 'disable' : 'enable');
		E2.dom.pause.button(cs == s.PAUSED || cs == s.STOPPED ? 'disable' : 'enable');
		E2.dom.stop.button(cs == s.STOPPED ? 'disable' : 'enable');
	}
	
	this.onPlayClicked = function()
	{
		self.player.play();
		self.changeControlState();
	};
	
	this.onPauseClicked = function()
	{
		self.player.pause();
		self.changeControlState();
	};

	this.onStopClicked = function()
	{
		self.player.stop();
		self.changeControlState();
		self.updateCanvas(false);
	};

	this.onSaveClicked = function()
	{
		var minify = E2.dom.save_minified.is(':checked');
		
		E2.dom.persist.val(' ');
		setTimeout(function(m) { return function() {
			E2.dom.persist.val(self.player.core.serialise(minify));
		}}(minify), 100);
	};
	
	this.onLoadClicked = function()
	{
		self.onStopClicked();
		self.player.load_from_json(E2.dom.persist.val());
		self.updateCanvas(false);
		E2.dom.persist.val(' ');
	};

	this.onLoadClipboardClicked = function()
	{
		var d = JSON.parse(E2.dom.persist.val());

		self.fillCopyBuffer(d.root.nodes, d.root.conns, 0, 0);
		E2.dom.persist.val(' ');
	};

	this.onShowTooltip = function(e)
	{
		if(self.in_drag)
			return false;
		
		var i_txt = $(e.currentTarget).attr('alt');
		
		i_txt = i_txt.replace(/\n/g, '<br/>');
		i_txt = i_txt.replace('Type:', '<b>Type:</b>');
		i_txt = i_txt.replace('Default:', '<b>Default:</b>');
		i_txt = i_txt.replace('Range:', '<b>Range:</b>');
		i_txt = i_txt.replace('<break>', '<br/><hr/>');
		
		E2.dom.info.html(i_txt);
	};
	
	this.onHideTooltip = function()
	{
		if(self.in_drag)
			return false;

		E2.dom.info.html('');
	};
	
    	$(document).mouseup(this.onMouseReleased);
	$(document).mousemove(this.onMouseMoved);
	$(window).keydown(this.onKeyDown);
	$(window).keyup(this.onKeyUp);
	
	canvas_parent.scroll(function()
	{
		self.scrollOffset = [ canvas_parent.scrollLeft(), canvas_parent.scrollTop() ];
		var s = canvas[0].style;
		
		s.left = '' + self.scrollOffset[0] + 'px';
		s.top = '' + self.scrollOffset[1] + 'px';
		self.updateCanvas(true);
	});
	
	canvas_parent.mousedown(this.onCanvasMouseDown);
	$(document).mouseup(this.onCanvasMouseUp);
	$(document).mousemove(this.onCanvasMouseMoved);
	
	// Clear hover state on window blur. Typically when the user switches
	// to another tab.
	$(window).blur(function()
	{
		self.shift_pressed = false;
		self.ctrl_pressed = false;
		self.releaseHoverSlot();
		self.releaseHoverNode(false);
	});
	
	$(window).resize(function(self) { return function()
	{
		// To avoid UI lag, we don't respond to window resize events directly.
		// Instead, we set up a timer that gets superceeded for each (spurious) 
		// resize event within a 100 ms window.
		clearTimeout(self.resize_timer);
		self.resize_timer = setTimeout(self.onWindowResize, 100);
	}}(this));
	
	var add_button_events = function(btn)
	{
		// We have to forward key events that would otherwise get trapped when
		// the user hovers over the playback control buttons.
		btn.keydown(this.onKeyDown);
		btn.keyup(this.onKeyUp);
	};
	
	add_button_events(E2.dom.play);
	add_button_events(E2.dom.pause);
	add_button_events(E2.dom.stop);
	add_button_events(E2.dom.save);
	add_button_events(E2.dom.load);
	
	// Ask user for confirmation on page unload
	/*$(window).bind('beforeunload', function()
	{
		return 'Oh... Please don\'t go.';
	});*/

	$('#fullscreen').button().click(function()
	{
		self.player.core.renderer.set_fullscreen(true);
	});
	
	$('#help').button().click(function()
	{
		window.open('help/introduction.html', 'Engi Help');
	});
}

function Player(canvas, app, root_node)
{
	var self = this;
	
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};

	this.app = app;
	this.core = new Core(app);
	this.interval = null;
	this.abs_time = 0.0;
	this.last_time = (new Date()).getTime();
	this.current_state = this.state.STOPPED;
	this.frames = 0;
	
	this.core.active_graph = this.core.root_graph = new Graph(this.core, null, root_node);
	this.core.graphs.push(this.core.root_graph);

	this.play = function()
	{
		this.core.root_graph.play();
		self.current_state = self.state.PLAYING;
		self.last_time = (new Date()).getTime();
		self.interval = requestAnimFrame(self.on_anim_frame);
	};
	
	this.pause = function()
	{
		self.current_state = self.state.PAUSED;
		
		if(self.interval != null)
		{
			cancelAnimFrame(self.interval);
			self.interval = null;
		}

		this.core.root_graph.pause();
	};

	this.stop = function()
	{
		if(self.interval != null)
		{
			cancelAnimFrame(self.interval);
			self.interval = null;
		}
		
		this.core.root_graph.stop();

		self.abs_time = 0.0;
		self.frames = 0;
		self.current_state = self.state.STOPPED;
		self.core.abs_t = 0.0;

		self.core.root_graph.reset();
		self.core.renderer.begin_frame(); // Clear the WebGL view.
		self.core.renderer.end_frame();
		
		if(app)
			app.updateCanvas(false);
	};

	this.on_anim_frame = function()
	{
		self.interval = requestAnimFrame(self.on_anim_frame);
		self.on_update();
	};

	this.on_update = function()
	{
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		if(self.core.update(self.abs_time, delta_t) && app.updateCanvas)
			app.updateCanvas(false);
		
		self.last_time = time;
		self.abs_time += delta_t;
		self.frames++;
	}
	
	this.load_from_json = function(json)
	{
		var c = self.core;
		
		c.renderer.texture_cache.clear();
		c.renderer.shader_cache.clear();
		c.deserialise(json);
	};
	
	this.load_from_url = function(url)
	{
		$.ajax({
			url: url,
			dataType: 'text',
			async: false,
			headers: {},
			success: function(json) 
			{
				self.load_from_json(json);
			}
		});
	};
}

function CreatePlayer(init_callback)
{
	$.ajaxSetup({ cache: false });
	$(document).ajaxError(function(e, jqxhr, settings, ex) 
	{
		if(typeof(ex) === 'string')
		{
			console.log(ex);
			return;
		}
			
		var m = 'ERROR: Script exception:\n';
		
		if(ex.fileName)
			m += '\tFilename: ' + ex.fileName;
			
		if(ex.lineNumber)
			m += '\tLine number: ' + ex.lineNumber;
		
		if(ex.message)
			m += '\tMessage: ' + ex.message;
			
		console.log(m);
	});
	
	E2.dom.webgl_canvas = $('#webgl-canvas');
	E2.app = {};
	E2.app.player = new Player(E2.dom.webgl_canvas, E2.app, null);
	
	// Block while plugins are loading...
	var wait_for_plugins = function()
	{
		var kl = Object.keys(E2.plugins).length;
		
		if(kl === E2.app.player.core.plugin_mgr.lid - 1)
			init_callback(E2.app.player);
		else 
			setTimeout(wait_for_plugins, 100);
	};
	
	wait_for_plugins();	
}

function InitialiseEngi()
{
	E2.dom.canvas_parent = $('#canvas_parent');
	E2.dom.canvas = $('#canvas');
	E2.dom.controls = $('#controls');
	E2.dom.webgl_canvas = $('#webgl-canvas');
	E2.dom.dbg = $('#dbg');
	E2.dom.play = $('#play');
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.save = $('#save');
	E2.dom.load = $('#load');
	E2.dom.load_clipboard = $('#load-clipboard');
	E2.dom.persist = $('#persist');
	E2.dom.structure = $('#structure');
	E2.dom.info = $('#info');
	E2.dom.save_minified = $('#save-minified');
	E2.dom.tabs = $('#tabs');
	E2.dom.snippets_list = $('#snippets-list');
	E2.dom.breadcrumb = $('#breadcrumb');
	
	$.ajaxSetup({ cache: false });

	msg('Welcome to WebFx. ' + (new Date()));
	
	E2.dom.dbg.ajaxError(function(e, jqxhr, settings, ex) 
	{
		if(settings.dataType === 'script' && !settings.url.match(/^plugins\/all.plugins\.js/)) 
		{
			if(typeof(ex) === 'string')
			{
				msg(ex);
				return;
			}
				
			var m = 'ERROR: Script exception:\n';
			
			if(ex.fileName)
				m += '\tFilename: ' + ex.fileName;
				
			if(ex.lineNumber)
				m += '\tLine number: ' + ex.lineNumber;
			
			if(ex.message)
				m += '\tMessage: ' + ex.message;
				
			msg(m);
		}
	});

	E2.app = new Application();
	
	E2.dom.structure.dynatree({
		title: "Structure",
		fx: { height: 'toggle', duration: 200 },
		clickFolderMode: 1, // Activate, don't expand.
		selectMode: 1, // Single.
		debugLevel: 0, // Quiet.
		dnd: {
			preventVoidMoves: true,
			onDragStart: function(node)
			{
				return true;
			},
			onDragEnter: function(node, src)
			{
				if(node.parent !== src.parent)
					return false;

				return ['before', 'after'];
			},
			onDrop: function(node, src, hit_mode, ui, draggable)
			{
				src.move(node, hit_mode);
				node.parent.graph.reorder_children(node, src, hit_mode);
			}
		},
		onActivate: function(node) 
		{
			E2.app.clearEditState();
			E2.app.clearSelection();
			E2.app.player.core.onGraphSelected(node.graph);
			E2.app.updateCanvas(true);
		}
	});
    
	var root_node = E2.dom.structure.dynatree('getRoot');

	E2.app.player = new Player(E2.dom.webgl_canvas, E2.app, root_node.addChild({
		title: 'Root',
		isFolder: true,
		expand: true
	}));

	E2.dom.play.button({ icons: { primary: 'ui-icon-play' } }).click(E2.app.onPlayClicked);
	E2.dom.pause.button({ icons: { primary: 'ui-icon-pause' }, disabled: true }).click(E2.app.onPauseClicked);
	E2.dom.stop.button({ icons: { primary: 'ui-icon-stop' }, disabled: true }).click(E2.app.onStopClicked);
	E2.dom.save.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-s' } }).click(E2.app.onSaveClicked);
	E2.dom.load.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-n' } }).click(E2.app.onLoadClicked);
	E2.dom.load_clipboard.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-n' } }).click(E2.app.onLoadClipboardClicked);

	$('#tabs').tabs();
	$('#content')[0].style.display = 'block';
	
	E2.app.onWindowResize();
	Notifier.init();
}
