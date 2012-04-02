/*
To do:

1. Begin timeline implementation.
 
*/

function E2()
{
};

E2.app = null;
E2.dom = {};
E2.plugins = {};
E2.slot_type = { input: 0, output: 1 };

function msg(txt)
{
	var d = E2.dom.dbg;

	d.append(txt + '\n');
	d.scrollTop(d[0].scrollHeight);
}

function make(tag)
{
	return $(document.createElement(tag));
}

function make_menu_item(id, nested)
{
	var li = make('li');
	var a = make('a');
	
	a.text(id);
	li.append(a);
	
	a.attr('href', '#' + ((nested === null) ? id : ''));

	if(nested !== null)
		li.append(nested);
	
	return li;
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
		assert(false, 'Failed to resolve graph with uid = ' + guid);
	
	return null;
};

function PluginGroup(id)
{
	var self = this;
	
	this.id = id;
	this.children = {};
	this.entries = {};
	
	this.get_or_create_group = function(id)
	{
		var g = self.children[id];
		
		if(!g)
		{
			g = new PluginGroup(id);
			self.children[id] = g;
		}
		
		return g;
	};
	
	this.add_entry = function(name, id)
	{
		var e = self.entries[name];
		
		assert(!e, 'Plugin keys must be unique, but a duplicate instance of the key "' + id + '" was found in plugins.json.');
	
		self.entries[name] = id;
	};
	
	this.insert_relative = function(key, id)
	{
		var tokens = key.split('/');
		
		assert(tokens.length > 0, 'Plugin key cannot be empty.');
		
		var g = self, len = tokens.length - 1;
		
		for(var i = 0; i < len; i++)
			g = g.get_or_create_group(tokens[i]);
		
		var key = tokens[len];
		
		g.add_entry(key, id);
		
		return key;
	};
	
	this.create_items = function()
	{
		var items = {}
		var sorted = sort_dict(self.children);
		
		for(var i = 0, len = sorted.length; i < len; i++)
		{
			var id = sorted[i];
			var child = self.children[id];
	
			items[id] = { name: id, items: child.create_items() };
		}
		
		sorted = sort_dict(self.entries);
		
		for(var i = 0, len = sorted.length; i < len; i++)
		{
			var id = sorted[i];
			var entry = self.entries[id];
			
			items[entry] = { name: id };
		}
			
		return items;
	};
}

function PluginManager(core, base_url) 
{
	var self = this;

	this.base_url = base_url;
	this.core = core;
	this.keybyid = {};
	this.release_mode = false;
	this.lid = 1;
	
	// First check if we're running a release build by checking for the existence
	// of 'all.plugins.js'
	var url = self.base_url + '/all.plugins.js';
	
	$.ajax({
		url: url,
		dataType: 'script',
		async: false,
		success: function(data, status) 
		{
			if(status == 'success')
			{	
				msg('PluginMgr: Running in release mode');
				self.release_mode = true;
			}
		},
		error: function()
		{
			msg('PluginMgr: Running in debug mode');
		}
	});

	this.register_plugin = function(pg_root, key, id)
	{
		self.keybyid[id] = pg_root.insert_relative(key, id);
		msg('Loaded ' + id + ' (' + self.lid + ')');
		self.lid++;
	};

	$.ajax({
		url: self.base_url + '/plugins.json',
		dataType: 'json',
		async: false,
		success: function(data)
		{
			var menu = make('ul');
			var pg_root = new PluginGroup('root');
			
			$.each(data, function(key, id) 
			{
				// Load the plugin, constrain filenames.
				var url = self.base_url + '/' + id + '.plugin.js';

   				if(!self.release_mode)
   				{
	   				$.ajax({
						url: url,
						dataType: 'script',
						async: false,
						success: (function(id) { return function(data, status) 
						{
							if(status == 'success')
								self.register_plugin(pg_root, key, id)
							else
								msg('Failed to load plugin \'' + id + '\'');
						}})(id)
					});
   				}
   				else
   					self.register_plugin(pg_root, key, id);
			});
			
			var items = pg_root.create_items();
			
			$.contextMenu({
				selector: '#canvas_parent',
				callback: E2.app.onPluginInstantiated,
				animation: { show: 'show', hide: 'hide' },
				zIndex: 10000,
				items: items 
			});
  		}
	});
	
	this.create = function(id, node) 
	{
		if(E2.plugins.hasOwnProperty(id))
		{
			var p = new E2.plugins[id](self.core, node);
			
			p.id = id;
			
			return p;
		}
			 
		assert(true, 'Failed to resolve plugin with id \'' + id + '\'. Please check that the right id is specified by the plugin implementation.');
		return null;
	};
}
 
function ConnectionUI(parent_conn)
{
	var self = this;
	
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
	this.src_slot_div = null;
	this.dst_slot_div = null;
	this.flow = false;
	this.selected = false;
	this.parent_conn = parent_conn;
	this.color = '#000';
	
	this.resolve_slot_divs = function()
	{
		var pc = self.parent_conn;
		
		self.src_slot_div = pc.src_node.ui.dom.find('#n' + pc.src_node.uid + (pc.src_slot.uid !== undefined ? 'do' + pc.src_slot.uid : 'so' + pc.src_slot.index));
		self.dst_slot_div = pc.dst_node.ui.dom.find('#n' + pc.dst_node.uid + (pc.dst_slot.uid !== undefined ? 'di' + pc.dst_slot.uid : 'si' + pc.dst_slot.index));
		
		assert(self.src_slot_div !== null && self.dst_slot_div !== null, 'Failed to resolve connection slot div.'); 
		
		self.src_pos = E2.app.getSlotPosition(self.src_slot_div, E2.slot_type.output);
		self.dst_pos = E2.app.getSlotPosition(self.dst_slot_div, E2.slot_type.input);
		
		assert(self.src_pos !== null && self.dst_pos !== null, 'Failed to resolve connection slot div position.'); 
	};
}

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	var self = this;
	
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	this.offset = 0;
	
	this.create_ui = function()
	{
		self.ui = new ConnectionUI(self);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
			self.ui = null;
	};
	
	this.toString = function()
	{
		return 'connection from ' + self.src_node.uid + '(' + self.src_slot.index + ') to ' + self.dst_node.uid + '(' + self.dst_slot.index + ')';
	};

	this.reset = function()
	{
		if(self.ui && self.ui.flow)
		{
			self.ui.flow = false;
			self.ui.color = '#000';
		}
	};
	
	this.reset_inbound_conns = function(node)
	{
		for(var i = 0, len = node.inputs.length; i < len; i++)
		{
			var c = node.inputs[i];
			
			c.reset();
			self.reset_inbound_conns(c.src_node);
		}
	};
	
	this.signal_change = function(on)
	{
		var n = self.src_node;
		
		if(n.plugin.connection_changed)
			n.plugin.connection_changed(on, self, self.src_slot);

		n.plugin.updated = true;
		
		if(!on)
		{
			self.reset_inbound_conns(n);
			
			if(n.plugin.reset)
				n.plugin.reset();
		}
		
		n = self.dst_node;
		n.inputs_changed = true;
		
		if(n.plugin.connection_changed)
			n.plugin.connection_changed(on, self, self.dst_slot);
	};
	
	this.serialise = function()
	{
		var d = {};
		
		d.src_nuid = self.src_node.uid;
		d.dst_nuid = self.dst_node.uid;
		d.src_slot = self.src_slot.index;
		d.dst_slot = self.dst_slot.index;
		
		d.src_connected = self.src_slot.connected;
		d.dst_connected = self.dst_slot.connected;
		
		if(self.src_slot.uid !== undefined)
			d.src_dyn = true;
		
		if(self.dst_slot.uid !== undefined)
			d.dst_dyn = true;

		if(self.offset !== 0)
			d.offset = self.offset;
		
		return d;
	};
	
	this.deserialise = function(d)
	{
		self.src_node = d.src_nuid;
		self.dst_node = d.dst_nuid;
		self.src_slot = { index: d.src_slot, dynamic: d.src_dyn ? true : false, connected: d.src_connected };
		self.dst_slot = { index: d.dst_slot, dynamic: d.dst_dyn ? true : false, connected: d.dst_connected };
		self.offset = d.offset ? d.offset : 0;
	};
	
	this.patch_up = function(nodes)
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
		
		self.src_node = resolve_node(self.src_node);
		self.dst_node = resolve_node(self.dst_node);
		
		var src_c = self.src_slot.connected;
		var dst_c = self.dst_slot.connected;
		
		self.src_slot = (self.src_slot.dynamic ? self.src_node.dyn_outputs : self.src_node.plugin.output_slots)[self.src_slot.index];
		self.dst_slot = (self.dst_slot.dynamic ? self.dst_node.dyn_inputs : self.dst_node.plugin.input_slots)[self.dst_slot.index];
		self.dst_slot.is_connected = true;
		
		if(src_c)
			self.src_slot.connected = true;

		if(dst_c)
			self.dst_slot.connected = true;

		self.src_node.outputs.push(self);
		self.dst_node.inputs.push(self);
	};
}

function NodeUI(parent_node, x, y) {
	var self = this;
	
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	this.plugin_ui = null;
	
	this.create_slot = function(nid, col, s, type)
	{
		var div = make('div');
	
		if(s.uid !== undefined)
			div.attr('id', nid + (type === E2.slot_type.input ? 'di' : 'do') + s.uid);
		else
			div.attr('id', nid + (type === E2.slot_type.input ? 'si' : 'so') + s.index);
	
		div.text(s.name);
		div.addClass('pl_slot');
		div.disableSelection();
		div.definition = s;
	
		div.mouseenter(E2.app.onSlotEntered(parent_node, s, div));
		div.mouseleave(E2.app.onSlotExited(parent_node, s, div));
		div.mousedown(E2.app.onSlotClicked(parent_node, s, div, type));
	
		col.append(div);
	};
	
	var render_slots = function(nid, col, slots, type)
	{
		for(var i = 0, len = slots.length; i < len; i++)
			self.create_slot(nid, col, slots[i], type);
	};
	
	var nid = 'n' + parent_node.uid;
	
	this.dom = make('table');
	this.dom.addClass('plugin');
	this.dom.addClass('ui-widget-content');
	this.dom.attr('id', nid);
	this.dom.mousemove(E2.app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	this.dom.addClass('pl_layout');
	
	var h_row = make('tr');
	var h_cell = make('td');
	
	h_cell.text(parent_node.get_disp_name());
	h_cell.attr('id', 't');
	h_cell.attr('colspan', '3');
	h_cell.disableSelection();
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(E2.app.onNodeHeaderClicked);
	h_row.dblclick(E2.app.onNodeHeaderDblClicked(parent_node));
	h_row.mouseenter(E2.app.onNodeHeaderEntered(parent_node));
	h_row.mouseleave(E2.app.onNodeHeaderExited);
	this.dom.append(h_row);
	
	this.header_row = h_row;
	
	var row = make('tr');
	
	this.dom.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.css('text-align', 'left');
	input_col.css('vertical-align', 'top');
	input_col.attr('id', 'ic');
	content_col.addClass('pui_col');
	content_col.attr('id', 'cc');
	output_col.css('text-align', 'right');
	output_col.css('vertical-align', 'top');
	output_col.attr('id', 'oc');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	render_slots(nid, input_col, parent_node.plugin.input_slots, E2.slot_type.input);
	render_slots(nid, output_col, parent_node.plugin.output_slots, E2.slot_type.output);
	
	if(parent_node.dyn_inputs)
		render_slots(nid, input_col, parent_node.dyn_inputs, E2.slot_type.input);
	
	if(parent_node.dyn_outputs)
		render_slots(nid, output_col, parent_node.dyn_outputs, E2.slot_type.output);

	var plugin = parent_node.plugin;
	
	if(plugin.create_ui)
	{
		this.plugin_ui = plugin.create_ui();
		
		content_col.append(this.plugin_ui);
	}
	else
		this.plugin_ui = {}; // We must set a dummy object so plugins can tell why they're being called.
	
	this.dom.draggable({
		drag: E2.app.onNodeDragged(parent_node),
		stop: E2.app.onNodeDragStopped(parent_node),
		cancel: '#cc'
    	});
    	
	this.dom.css('display', 'none');
	
	E2.dom.canvas_parent.append(this.dom);

	this.dom.css('top', '' + y + 'px');
	this.dom.css('left', '' + x + 'px');

	this.dom.show();
}

function Node(parent_graph, plugin_id, x, y) {
	var self = this;
	
	this.inputs = [];
	this.outputs = [];
	this.dyn_slot_uid = 0;
	
	self.set_plugin = function(plugin)
	{
		self.plugin = plugin;
		self.plugin.updated = true;
		
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
		
	this.create_ui = function()
	{
		self.ui = new NodeUI(self, self.x, self.y);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
		{
			self.ui.dom.hide();
			self.ui.dom.remove();
			self.ui = null;
		}
	};
	
	this.destroy = function()
	{
		var graph = self.parent_graph;
		var index = graph.nodes.indexOf(self);
		var pending = [];
		
		graph.emit_event({ type: 'node-destroyed', node: self });
		
		if(index != -1)
			graph.nodes.splice(index, 1);
		
		pending.push.apply(pending, self.inputs);
		pending.push.apply(pending, self.outputs);
		
		for(var i = 0, len = pending.length; i < len; i++)
			graph.destroy_connection(pending[i]);
		
		if(self.id === 'Graph')
			self.plugin.graph.tree_node.remove();
		
		self.destroy_ui();
	};
	
	this.get_disp_name = function()
	{
		return self.title === null ? self.id : self.title;
	};
	
	this.reset = function()
	{
		var p = self.plugin;
		
		if(p.reset)
		{
			p.reset();
			p.updated = true;
		}
		
		if(p.input_slots.length === 0 && self.dyn_inputs && self.dyn_inputs === 0)
			p.updated = true;
	};
	
	this.add_slot = function(slot_type, def)
	{
		var suid = self.dyn_slot_uid++;
		var is_inp = slot_type === E2.slot_type.input;
		def.uid = suid;
		
		if(is_inp)
		{
			if(!self.dyn_inputs)
				self.dyn_inputs = [];
			
			def.index = self.dyn_inputs.length;
			def.type = E2.slot_type.input;
			self.dyn_inputs.push(def);			
		}
		else
		{
			if(!self.dyn_outputs)
				self.dyn_outputs = [];
			
			def.index = self.dyn_outputs.length;
			def.type = E2.slot_type.output;
			self.dyn_outputs.push(def);			
		}
		
		if(self.ui)
		{
			var col = self.ui.dom.find(is_inp ? '#ic' : '#oc');
			
			self.ui.create_slot('n' + self.uid, col, def, slot_type);
		}
		
		return suid;
	};
	
	this.remove_slot = function(slot_type, suid)
	{
		var is_inp = slot_type === E2.slot_type.input;
		var slots = is_inp ? self.dyn_inputs : self.dyn_outputs;
		
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
				self.dyn_inputs = undefined;
			else
				self.dyn_outputs = undefined;
		}
		
		if(self.ui)
			self.ui.dom.find('#n' + self.uid + (is_inp ? 'di' : 'do') + slot.uid).remove();
		
		var att = is_inp ? self.inputs : self.outputs;
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
				s.index--;
				
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
			self.parent_graph.destroy_connection(pending[i]);
		}
			
		if(canvas_dirty)
			E2.app.updateCanvas();
	};
	
	this.rename_slot = function(slot_type, suid, name)
	{
		var is_inp = slot_type === E2.slot_type.input;
		var slots = is_inp ? self.dyn_inputs : self.dyn_outputs;
		
		if(!slots)
			return;
		
		for(var i = 0, len = slots.length; i < len; i++)
		{
			if(slots[i].uid === suid)
			{
				var slot = slots[i];

				slot.name = name;

				if(self.ui)
					self.ui.dom.find('#n' + self.uid + (is_inp ? 'di' : 'do') + slot.uid).text(name);

				break; // Early out.
			}
		}
	};
		
	this.update_connections = function()
	{
		var gsp = E2.app.getSlotPosition;
		
		for(var i = 0, len = self.outputs.length; i < len; i++)
		{
			var c = self.outputs[i];
			
			c.ui.src_pos = gsp(c.ui.src_slot_div, E2.slot_type.output);
		}
		
		for(var i = 0, len = self.inputs.length; i < len; i++)
		{
			var c = self.inputs[i];
			
			c.ui.dst_pos = gsp(c.ui.dst_slot_div, E2.slot_type.input);
		}
	};
	
	this.update_recursive = function(conns, delta_t)
	{
		var dirty = false;

		if(self.update_count < 1)
		{
			var uid = self.uid;
			var inputs = self.inputs;
			var needs_update = self.inputs_changed;
			var s_plugin = self.plugin;
		
			for(var i = 0, len = inputs.length; i < len; i++)
			{
				var inp = inputs[i];
				var sn = inp.src_node;
				 
				dirty = sn.update_recursive(conns, delta_t) || dirty;
			
				var value = sn.plugin.update_output(inp.src_slot);
			
				if(sn.plugin.updated)
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
				else if(inp.ui && inp.ui.flow)
				{
					inp.ui.flow = false;
					dirty = true;
				}
			}
		
			if(needs_update || s_plugin.output_slots.length === 0 || (s_plugin.outputs && s_plugin.outputs.length === 0))
			{
				if(s_plugin.update_state)
					s_plugin.update_state(delta_t);
			
				self.inputs_changed = false;
			}
			else if(s_plugin.input_slots.length === 0 || (s_plugin.inputs && s_plugin.inputs.length === 0))
			{
				if(s_plugin.update_state)
					s_plugin.update_state(delta_t);
			}
		}
		
		self.update_count++;

		return dirty;
	};
	
	this.serialise = function()
	{
		var d = {};
		
		d.plugin = self.plugin.id;
		d.x = Math.round(self.x);
		d.y = Math.round(self.y);
		d.uid = self.uid;
		
		if(self.dyn_slot_uid)
			d.dsid = self.dyn_slot_uid;
		
		if(self.plugin.state)
			d.state = self.plugin.state;

		if(self.title)
			d.title = self.title;
		
		if(self.plugin.id === 'graph')
			d.graph = self.plugin.graph.serialise();
		
		if(self.dyn_inputs || self.dyn_outputs)
		{
			var pack_dt = function(slots)
			{
				for(var i = 0, len = slots.length; i < len; i++)
					slots[i].dt = slots[i].dt.id;
			};
			
			if(self.dyn_inputs)
			{
				d.dyn_in = self.dyn_inputs.slice(0);
				pack_dt(d.dyn_in);
			}
			
			if(self.dyn_outputs)
			{
				d.dyn_out = self.dyn_outputs.slice(0);
				pack_dt(d.dyn_out);
			}
		}

		return d;
	};
	
	this.deserialise = function(guid, d)
	{
		self.parent_graph = guid;
		self.x = d.x;
		self.y = d.y;
		self.id = E2.app.core.plugin_mgr.keybyid[d.plugin];
		self.uid = d.uid;
		
		if(d.dsid)
			self.dyn_slot_uid = d.dsid;
		
		self.title = d.title ? d.title : null;
		
		self.set_plugin(E2.app.core.plugin_mgr.create(d.plugin, self));
		
		if(self.plugin.id === 'graph')
		{
			self.plugin.graph = new Graph(null, null);
			self.plugin.graph.plugin = self.plugin;
			self.plugin.graph.deserialise(d.graph);
			self.plugin.graph.reg_listener(self.plugin.graph_event);
			E2.app.core.graphs.push(self.plugin.graph);
		}
		
		if(d.state)
			self.plugin.state = d.state;
		
		if(d.dyn_in || d.dyn_out)
		{
			var patch_slot = function(slots, type)
			{
				var rdt = E2.app.core.resolve_dt;
				
				for(var i = 0, len = slots.length; i < len; i++)
				{
					var s = slots[i];
					 
					s.dt = rdt[s.dt];
					s.type = type;
				}
			};
			
			if(d.dyn_in)
			{
				self.dyn_inputs = d.dyn_in;
				patch_slot(self.dyn_inputs, E2.slot_type.input);
			}
			
			if(d.dyn_out)
			{
				self.dyn_outputs = d.dyn_out;
				patch_slot(self.dyn_outputs, E2.slot_type.output);
			}
		}
	};
	
	this.patch_up = function(graphs)
	{
		self.parent_graph = resolve_graph(graphs, self.parent_graph);

		if(self.plugin.id === 'graph')
			self.plugin.graph.patch_up(graphs);
		
		if(self.plugin.state_changed)
			self.plugin.state_changed(null);
	};

	// Initialisation. Must be declared last in the Node definition due to a quirk
	// in JS parsing: The plugin initialization code cannot call a method on its
	// node parent unless this is declared before the code that invokes the plugin
	// initialization code below. In short: This is placed here for a reason and must
	// stay no matter how counterintuitive and inconsistent it makes the code layout.
	if(plugin_id !== null) // Don't initialise if we're loading.
	{
		this.parent_graph = parent_graph;
		this.x = x;
		this.y = y;
		this.ui = null;
		this.id = E2.app.core.plugin_mgr.keybyid[plugin_id];
		this.uid = parent_graph.get_node_uid();
		this.update_count = 0;
		this.title = null;
		this.inputs_changed = false;
		
		self.set_plugin(E2.app.core.plugin_mgr.create(plugin_id, this));
	};
}


function Graph(parent_graph, tree_node) 
{
	var self = this;
	
	this.tree_node = tree_node;
	this.listeners = [];

	if(tree_node !== null) // Only initialise if we're not deserialising.
	{
		this.uid = E2.app.core.get_graph_uid();
		this.parent_graph = parent_graph;
		this.nodes = [];
		this.roots = [];
		this.connections = [];
		this.node_uid = 0;
			
		tree_node.graph = this;
	}
	
	this.get_node_uid = function()
	{
		return self.node_uid++;
	};
	
	this.create_instance = function(plugin_id, x, y)
	{
		n = new Node(self, plugin_id, x, y);
		
		self.nodes.push(n);
		
		if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
			self.roots.push(n);
		
		self.emit_event({ type: 'node-created', node: n });
		return n;
	};
	
	this.update = function(delta_t)
	{
		var nodes = self.nodes;
		var roots = self.roots;
		var dirty = false;
		
		for(var i = 0, len = nodes.length; i < len; i++)
			nodes[i].update_count = 0;
		
		for(var i = 0, len = roots.length; i < len; i++)
			dirty = roots[i].update_recursive(self.connections, delta_t) || dirty;
		
		if(self === E2.app.core.active_graph)
			E2.app.core.active_graph_dirty = dirty;
		
		for(var i = 0, len = nodes.length; i < len; i++)
			nodes[i].plugin.updated = false;
		
		return dirty;
	};
	
	this.enum_all = function(n_delegate, c_delegate)
	{
		var nodes = self.nodes,
		    conns = self.connections;
		    
		for(var i = 0, len = nodes.length; i < len; i++)
			n_delegate(nodes[i]);

		for(var i = 0, len = conns.length; i < len; i++)
			c_delegate(conns[i]);
	};
	
	this.reset = function()
	{
		self.enum_all(function(n)
		{
			n.reset();
		},
		function(c)
		{
			c.reset();
		});
	};
	
	this.destroy_connection = function(c)
	{
		var index = self.connections.indexOf(c);
		
		if(index != -1)
			self.connections.splice(index, 1);
		
		c.dst_slot.is_connected = false;
		
		var slots = c.dst_node.inputs;
		
		index = slots.indexOf(c);
	
		if(index != -1)
			slots.splice(index, 1);

		slots = c.src_node.outputs;
		index = slots.indexOf(c);
	
		if(index != -1)
			slots.splice(index, 1);
	};
	
	this.create_ui = function()
	{
		self.enum_all(function(n)
		{
			n.reset();
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

	this.destroy_ui = function()
	{
		self.enum_all(function(n) { n.destroy_ui(); }, function(c) { c.destroy_ui(); });
	};
	
	this.find_connections_from = function(node, slot)
	{
		if(slot.type !== E2.slot_type.output)
			return [];
		
		var conns = self.connections;
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
	
	this.serialise = function()
	{
		var d = {};
		
		d.node_uid = self.node_uid;
		d.uid = self.uid;
		d.parent_uid = self.parent_graph ? self.parent_graph.uid : -1;
		
		d.nodes = [];
		d.conns = [];
		
		self.enum_all(function(n) { d.nodes.push(n.serialise()); }, function(c) { d.conns.push(c.serialise()); });

		return d;
	};
	
	this.deserialise = function(d)
	{
		self.node_uid = d.node_uid;
		self.uid = d.uid;
		self.parent_graph = d.parent_uid;
				
		self.nodes = [];
		self.roots = [];
		
		for(var i = 0, len = d.nodes.length; i < len; i++)
		{
			var n = new Node(null, null, null, null);
			
			n.deserialise(self.uid, d.nodes[i]);
			self.nodes.push(n);
			
			if(n.plugin.output_slots.length === 0 && !n.dyn_outputs)
				self.roots.push(n);
		}

		self.connections = [];

		for(var i = 0, len = d.conns.length; i < len; i++)
		{
			var c = new Connection(null, null, null, null);
			
			c.deserialise(d.conns[i]);
			self.connections.push(c);
		}
	};
	
	this.patch_up = function(graphs)
	{
		self.parent_graph = resolve_graph(graphs, self.parent_graph);
		
		self.enum_all(function(n) { n.patch_up(graphs); }, function(c) { c.patch_up(self.nodes); });
		self.reset();
	};
	
	this.reg_listener = function(delegate)
	{
		if(!self.listeners.indexOf(delegate) !== -1)
			self.listeners.push(delegate);
	};
	
	this.emit_event = function(ev)
	{
		var l = self.listeners,
		    len = l.length;
		
		if(len === 0)
			return;
		
		for(var i = 0; i < len; i++)
			l[i](ev);
	};
}

function Core() {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' },
		TRANSFORM: { id: 4, name: 'Transform' },
		VERTEX: { id: 5, name: 'Vertex' },
		CAMERA: { id: 6, name: 'Camera' },
		BOOL: { id: 7, name: 'Boolean' },
		ANY: { id: 8, name: 'Arbitrary' }
	};
	
	this.renderer = new Renderer('#webgl-canvas');
	this.active_graph = this.root_graph = null;
	this.active_graph_dirty = true;
	this.graphs = [];
	
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	this.graph_uid = 0;
	
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
		self.renderer.update();
		
		self.root_graph.update(delta_t);
		
		var dirty = self.active_graph_dirty;
		
		self.active_graph_dirty = false;
		
		return dirty; // Did connection state change?
	};
	
	this.onGraphSelected = function(graph)
	{
		self.active_graph.destroy_ui();
		self.active_graph = graph;
		self.root_graph.reset();
		self.active_graph.create_ui();
	};
	
	this.get_default_value = function(dt)
	{
		if(dt === self.datatypes.FLOAT)
			return 0.0;
		else if(dt === self.datatypes.COLOR)
			return new Color(1, 1, 1);
		else if(dt === self.datatypes.TRANSFORM)
		{
			var m = mat4.create();
	
			mat4.identity(m);
			return m;
		}
		else if(dt === self.datatypes.VERTEX)
			return [0.0, 0.0, 0.0];
		else if(dt === self.datatypes.CAMERA)
			return new Camera(self.renderer.context);
		else if(dt === self.datatypes.BOOL)
			return false;
		
		// Shaders and textures legally default to null.
		return null;
	};
	
	this.serialise = function()
	{
		var d = {};
		
		d.abs_t = Math.round(self.abs_t * Math.pow(10, 4)) / Math.pow(10, 4);
		d.active_graph = self.active_graph.uid;
		d.graph_uid = self.graph_uid;
		d.root = self.root_graph.serialise();
		
		return JSON.stringify(d, undefined, 4);
	};
	
	this.deserialise = function(str)
	{
		var d = JSON.parse(str);
		
		self.abs_t = d.abs_t;
		self.delta_t = 0.0;
		self.graph_uid = d.graph_uid;

		self.active_graph.destroy_ui();
		
		var graphs = self.graphs = [];
		
		self.root_graph = new Graph(null, null);
		self.root_graph.deserialise(d.root);
		self.graphs.push(self.root_graph);
		self.root_graph.patch_up(self.graphs);
			
		self.active_graph = resolve_graph(self.graphs, d.active_graph); 
		self.rebuild_structure_tree();
		self.active_graph.tree_node.activate();
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
				expand: true
			});
			
			graph.tree_node = tnode;
			tnode.graph = graph;
			
			for(var i = 0, len = nodes.length; i < len; i++)
			{
				var n = nodes[i];
				
				if(n.plugin.id === 'graph')
					build(n.plugin.graph, n.get_disp_name());
			}
		};
		
		build(self.root_graph, 'Root');
	};
}

function Application() {
	var canvas_parent = $("#canvas_parent");
	var canvas = $("#canvas");
		
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.core = new Core();
	this.canvas = canvas;
	this.c2d = canvas[0].getContext('2d');
	this.last_mouse_pos = [0, 0];
	this.current_state = this.state.STOPPED;
	this.interval = null;
	this.abs_time = 0.0;
	this.last_time = (new Date()).getTime();
	this.src_node = null;
	this.dst_node = null;
	this.src_slot = null;
	this.src_slot_div = null;
	this.dst_slot = null;
	this.dst_slot_div = null;
	this.edit_conn = null;
	this.shift_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hover_node = null;
	this.scrollOffset = [0, 0];
	this.accum_delta = 0.0;
	
	var self = this;
	
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
		
		return [x, o[1] + (slot_div.height() / 2)];
	};
	
	this.onPluginInstantiated = function(id, opt)
	{	
		var pos = opt.$menu.offset();
		var cp = canvas_parent;
		var co = cp.offset();
		var createPlugin = function(name)
		{
			var node = self.core.active_graph.create_instance(id, (pos.left - co.left) + cp.scrollLeft(), (pos.top - co.top) + cp.scrollTop());
		
			node.reset();

			if(name !== null) // Graph?
			{
				node.title = name;
				node.plugin.graph = new Graph(node.parent_graph, node.parent_graph.tree_node.addChild({
					title: name,
					isFolder: true,
					expand: true
				}));
				
				node.plugin.graph.plugin = node.plugin;
				node.plugin.graph.reg_listener(node.plugin.graph_event);
				self.core.graphs.push(node.plugin.graph);
			}
			
			node.create_ui();
			
			if(node.plugin.state_changed)
				node.plugin.state_changed(node.ui.plugin_ui);			
		};
		
		if(id === 'graph')
		{
			var diag = make('div');
			var inp = $('<input type="input" value="graph(' + self.core.active_graph.node_uid + ')" />'); 
		
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
				open: function(i) { return function()
				{
					i.focus().select();
				}}(inp)
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
			self.src_node = node;
			self.src_slot = slot;
			self.src_slot_div = slot_div;
			self.edit_conn = new Connection(null, null, null, null);
			self.edit_conn.create_ui();
			self.edit_conn.ui.src_pos = self.getSlotPosition(slot_div, E2.slot_type.output);
		
			var graph = self.core.active_graph;
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
			slot_div.css('color', '#0f0');
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
		
		self.hover_slot_div.css('background-color', '#f00');
		
		// Mark any attached connection
		var conns = self.core.active_graph.connections;
		var dirty = false;
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var c = conns[i];
			
			if(c.dst_slot === hs || c.src_slot === hs)
			{
				c.ui.selected = true;
				self.hover_connections.push(c);
				dirty = true;
								
				if(hs.type == E2.slot_type.input)
					break; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
			}
		}
		
		if(dirty)
			self.updateCanvas();
	};
	
	this.releaseHoverSlot = function()
	{
		if(self.hover_slot != null)
		{
			self.hover_slot_div.css('background-color', 'inherit');
			self.hover_slot_div = null;
			self.hover_slot = null;
		}
		
		var hcs = self.hover_connections;
		
		if(hcs.length > 0)
		{
			for(var i = 0, len = hcs.length; i < len; i++)
				hcs[i].ui.selected = false;

			self.hover_connections = [];
			self.updateCanvas();
		}
		
		if(self.dst_slot_div != null)
		{
			self.dst_slot_div.css('color', '#000');
			self.dst_slot_div = null;
		}

	};
	
	this.onSlotEntered = function(node, slot, slot_div) { return function(e)
	{
		if(self.src_slot)
		{
			self.dst_slot_div = slot_div;
			
			var ss_dt = self.src_slot_div.definition.dt;
			
			// Only allow connection if datatypes match and slot is unconnected. 
			// Don't allow self-connections. There no complete check for cyclic 
			// redundacies, though we should probably institute one.
			// Additionally, don't allow connections between two ANY slots.
			if((ss_dt === self.core.datatypes.ANY || 
			    slot.dt === self.core.datatypes.ANY || 
			    ss_dt === slot.dt) && 
			    	    !(ss_dt === self.core.datatypes.ANY && slot.dt === self.core.datatypes.ANY) &&
				    !slot.is_connected && 
				    self.src_node !== node)
			{
				self.dst_node = node;
				self.dst_slot = slot;
				slot_div.css('color', '#0f0');
			}
			else
			{
				self.dst_node = null;
				self.dst_slot = null;
				slot_div.css('color', '#f00');
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
	
	this.drawConnection = function(c2d, conn)
	{
		var odd_scale = 0.84, // TODO: Where in the universe is this comming from?
		    c = conn.ui,
		    so = self.scrollOffset,
		    x1 = (c.src_pos[0] - so[0]) * odd_scale,
		    y1 = c.src_pos[1] - so[1],
		    x4 = (c.dst_pos[0] - so[0]) * odd_scale,
		    y4 = c.dst_pos[1] - so[1],
		    mx = (x1 + x4) / 2,
		    my = (y1 + y4) / 2,
		    x2 = Math.min(x1 + 10 + (conn.offset * 5), mx);
		
		c2d.moveTo(x1, y1);
		c2d.lineTo(x2, y1);
		c2d.lineTo(x2, y4);
		c2d.lineTo(x4, y4);
	};
	
	this.updateCanvas = function()
	{
		var c = self.c2d;
		var canvas = self.canvas[0];
		 
		c.clearRect(0, 0, canvas.width, canvas.height);
		
		var conns = self.core.active_graph.connections;
		var cb = [[], [], []];
		var styles = ['#000', '#44e', '#f00'];
		
		for(var i = 0, len = conns.length; i < len; i++)
		{
			var con = conns[i];

			// Draw inactive connections first, then connections with data flow
			// and finally selected connections to ensure they get rendered on top.
			cb[con.ui.selected ? 2 : con.ui.flow ? 1 : 0].push(con);
		}
		
		if(self.edit_conn)
		{
			self.edit_conn.ui.dst_pos = self.last_mouse_pos.slice(0);
			cb[0].push(self.edit_conn);
		}
		
		for(var bin = 0; bin < 3; bin++)
		{
			var b = cb[bin];

			if(b.length > 0)
			{
				c.strokeStyle = styles[bin];
				c.beginPath();
			
				for(var i = 0, len = b.length; i < len; i++)
					self.drawConnection(c, b[i]);
				
				c.stroke()
			}
		}
	};
	
	this.onMouseMoved = function(e)
	{
		if(self.src_slot)
			self.updateCanvas();
		
		var ofs = canvas_parent.offset();
		
		self.last_mouse_pos = [(e.pageX - ofs.left) + self.scrollOffset[0], (e.pageY - ofs.top) + self.scrollOffset[1]];
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
			
			var graph = self.core.active_graph; 
			
			graph.connections.push(c);
			
			c.signal_change(true);

			self.dst_slot_div.css('color', '#000');
			self.dst_slot.is_connected = true;
			self.dst_slot_div = null;
			self.dst_slot = null;
		}

		if(self.src_slot)
		{
			self.src_slot_div.css('color', '#000');
			self.src_slot = null;
			self.src_slot_div = null;
		}
		
		self.dst_node = null;
		self.src_node = null;
		self.edit_conn = null;
		self.updateCanvas();
	};
	
	this.activateHoverNode = function()
	{
		if(self.hover_node !== null)
		{
			self.hover_node.ui.header_row.css('background-color', '#f00');
		
			var hcs = self.hover_connections;
			var conns = self.core.active_graph.connections;
			var uid = self.hover_node.uid;
			
			for(var i = 0, len = conns.length; i < len; i++)
			{
				var c = conns[i];
				
				if(c.src_node.uid == uid || c.dst_node.uid == uid)
				{
					c.ui.selected = true;
					hcs.push(c);
				}
			}
			
			if(hcs.length > 0)
				self.updateCanvas();
		}
	};
	
	this.releaseHoverNode = function()
	{
		if(self.hover_node !== null)
		{
			self.hover_node.ui.header_row.css('background-color', '#dde'); // TODO: Ugly. This belongs in a style sheet.
			self.hover_node = null;
			
			var hcs = self.hover_connections;
			
			if(hcs.length > 0)
			{
				for(var i = 0, len = hcs.length; i < len; i++)
					hcs[i].ui.selected = false;

				self.updateCanvas();
			}
		}
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
		self.hover_slot = null;
		self.hover_slot_div = null;
		self.hover_connections = [];
		self.hover_node = null;
	};
	
	this.removeHoverConnections = function()
	{
			var hcs = self.hover_connections;
		
			if(hcs.length > 0)
			{
				var graph = self.core.active_graph;
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
				self.updateCanvas();
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
		self.releaseHoverNode();
		self.hover_node = null;
	};
	
	this.onNodeHeaderClicked = function(e)
	{
		e.stopPropagation();
		
		if(self.shift_pressed && self.hover_node !== null)
		{
			var hn = self.hover_node;
			
			self.releaseHoverNode();
			hn.destroy();
			
			self.updateCanvas();
			self.removeHoverConnections();
		}
		
		return false;
	};
	
	this.onNodeHeaderDblClicked = function(node) { return function(e)
	{
		var diag = make('div');
		var inp = $('<input type="input" value="' + (node.title === null ? node.id : node.title) + '" />'); 
	
		inp.css('width', '410px');
		diag.append(inp);
	
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
					node.title = inp.val();
					
					if(node.ui !== null)
						node.ui.dom.find('#t').text(node.title);
					
					if(node.plugin.id === 'graph')
						node.plugin.graph.tree_node.setTitle(node.title);
					
					node.parent_graph.emit_event({ type: 'node-renamed', node: node });
					$(this).dialog('close');
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			},
			open: function(i) { return function()
			{
				i.focus().select();
			}}(inp)
		});
	}};
	
	this.onNodeDragged = function(node) { return function(e)
	{
		var conns = self.core.active_graph.connections;
		var canvas_dirty = false;
		var pos = node.ui.dom.position();
		
		node.x = canvas_parent.scrollLeft() + pos.left;
		node.y = canvas_parent.scrollTop() + pos.top;
		
		node.update_connections();
		
		if(node.inputs.length + node.outputs.length > 0)
			self.updateCanvas();
	}};
	
	this.onNodeDragStopped = function(node) { return function(e)
	{
		self.onNodeDragged(node)(e);
	}};
	
	this.onKeyDown = function(e)
	{
		if(e.keyCode === 16) // .isShift doesn't work on Chrome. This does.
		{
			self.shift_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
	};
	
	this.onKeyUp = function(e)
	{
		if(e.keyCode === 16)
		{
			self.shift_pressed = false;
			self.releaseHoverSlot();
			self.releaseHoverNode();
		}
	};

	this.changeControlState = function()
	{
		var cs = self.current_state;
		
		E2.dom.play.button(cs == self.state.PLAYING ? 'disable' : 'enable');
		E2.dom.pause.button(cs == self.state.PAUSED || cs == self.state.STOPPED ? 'disable' : 'enable');
		E2.dom.stop.button(cs == self.state.STOPPED ? 'disable' : 'enable');
	}
	
	this.onPlayClicked = function()
	{
		self.current_state = self.state.PLAYING;
		self.changeControlState();
		
		self.last_time = (new Date()).getTime();
		self.interval = setInterval(function() {
			E2.app.onUpdate();
		}, 0);
	};
	
	this.onPauseClicked = function()
	{
		self.current_state = self.state.PAUSED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
	};

	this.onStopClicked = function()
	{
		self.abs_time = 0.0;
		self.current_state = self.state.STOPPED;
		self.changeControlState();
		
		if(self.interval != null)
		{
			clearInterval(self.interval);
			self.interval = null;
		}
		
		self.core.active_graph.reset();
		self.core.renderer.update(); // Clear the WebGL view.
		self.updateCanvas();
	};

	this.onSaveClicked = function()
	{
		E2.dom.persist.val(self.core.serialise());
	};
	
	this.onLoadClicked = function()
	{
		self.onStopClicked();
		self.core.deserialise(E2.dom.persist.val());
		self.updateCanvas();
	};

	this.onUpdate = function()
	{
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		if(self.core.update(self.abs_time, delta_t))
			self.updateCanvas();
		
		self.accum_delta += delta_t;
		
		if(self.accum_delta > 0.05)
		{
			E2.dom.frame.val(delta_t.toFixed(4));
			self.accum_delta = 0.0;
		}
		
		self.last_time = time;
		self.abs_time += delta_t;
	}
	
	// $(document).mouseup(this.onMouseReleased);
	E2.dom.canvas_parent.mouseup(this.onMouseReleased);
	$(document).keydown(this.onKeyDown);
	$(document).keyup(this.onKeyUp);
	canvas.mousemove(this.onMouseMoved);
	canvas_parent.scroll(function()
	{
		self.scrollOffset = [ canvas_parent.scrollLeft(), canvas_parent.scrollTop() ];
		canvas.css('left', '' + self.scrollOffset[0] + 'px');
		canvas.css('top', '' + self.scrollOffset[1] + 'px');
		self.updateCanvas();
	});
	
	// If the user uses any of the existing browser SHIFT hotkey (like new tab!),
	// make sure we clear our hover state.
	$(window).blur(function()
	{
		self.shift_pressed = false;
		self.releaseHoverSlot();
		self.releaseHoverNode();
	});
	
	// Make sure all the input fields blur themselves when they gain focus --
	// otherwise they trap the control key document events. TODO: Surely there is a
	// better way to deal with this atrocious nonsense?
	E2.dom.play.focus(function(e) { E2.dom.play.blur(); });
	E2.dom.pause.focus(function(e) { E2.dom.pause.blur(); });
	E2.dom.stop.focus(function(e) { E2.dom.stop.blur(); });
	E2.dom.save.focus(function(e) { E2.dom.save.blur(); });
	E2.dom.load.focus(function(e) { E2.dom.load.blur(); });
}

$(document).ready(function() {
	E2.dom.canvas_parent = $('#canvas_parent');
	E2.dom.dbg = $('#dbg');
	E2.dom.play = $('#play');
	E2.dom.pause = $('#pause');
	E2.dom.stop = $('#stop');
	E2.dom.save = $('#save');
	E2.dom.load = $('#load');
	E2.dom.frame = $('#frame');
	E2.dom.persist = $('#persist');
	E2.dom.structure = $('#structure');
	
	$.ajaxSetup({ cache: false });
	
	$.fn.extend({ disableSelection: function() { 
			this.each(function() { 
				if (typeof this.onselectstart != 'undefined') {
					this.onselectstart = function() { return false; };
				} else if (typeof this.style.MozUserSelect != 'undefined') {
					this.style.MozUserSelect = 'none';
				} else {
					this.onmousedown = function() { return false; };
				}
			}); 
		} 
	});

	msg('Welcome to WebFx. ' + (new Date()));
	
	E2.dom.dbg.ajaxError(function(e, jqxhr, settings, exception) {
		if(settings.dataType === 'script' && !settings.url.match(/^plugins\/all.plugins\.js/)) {
			msg(exception.message + exception.stack);
		}
	});

	E2.app = new Application();
	E2.app.core.plugin_mgr = new PluginManager(E2.app.core, 'plugins');
	
	E2.dom.structure.dynatree({
		title: "Structure",
		fx: { height: 'toggle', duration: 200 },
		clickFolderMode: 1, // Activate, don't expand.
		selectMode: 1, // Single.
		debugLevel: 0, // Quiet.
		onActivate: function(node) 
		{
			E2.app.clearEditState();
			E2.app.core.onGraphSelected(node.graph);
			E2.app.updateCanvas();
		}
	});
    
	var root_node = E2.dom.structure.dynatree('getRoot');
	var gn_root = root_node.addChild({
		title: 'Root',
		isFolder: true,
		expand: true
	});	
	
	// TODO: Because graphs depend on the existence of the core singleton
	// we can't create graph instances in the core initialisation code. Moreover,
	// even though we could introduce a UID manager to move this out of the core,
	// where would *that* singleton live? In the core... Most awkward.
	// The alternative is to have the UID manager singleton be global? Ugh..
	E2.app.core.active_graph = E2.app.core.root_graph = new Graph(null, gn_root);
	E2.app.core.graphs.push(E2.app.core.root_graph);
	
	E2.dom.play.button({ icons: { primary: 'ui-icon-play' } }).click(E2.app.onPlayClicked);
	E2.dom.pause.button({ icons: { primary: 'ui-icon-pause' }, disabled: true }).click(E2.app.onPauseClicked);
	E2.dom.stop.button({ icons: { primary: 'ui-icon-stop' }, disabled: true }).click(E2.app.onStopClicked);
	E2.dom.save.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-s' } }).click(E2.app.onSaveClicked);
	E2.dom.load.button({ icons: { primary: 'ui-icon-arrowreturnthick-1-n' } }).click(E2.app.onLoadClicked);

  	msg('Ready.');	
	$('#content').css('display', 'block');
});
