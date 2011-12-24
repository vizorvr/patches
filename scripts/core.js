var app = null;
var g_Plugins = {};

function msg(txt)
{
	var d = $('#dbg');

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
		
		var g = self;
		
		for(var i = 0; i < tokens.length - 1; i++)
			g = g.get_or_create_group(tokens[i]);
		
		var key = tokens[tokens.length-1];
		
		g.add_entry(key, id);
		
		return key;
	};
	
	this.create_items = function()
	{
		var items = {}
		var sorted = sort_dict(self.children);
		
		for(var i = 0; i < sorted.length; i++)
		{
			var id = sorted[i];
			var child = self.children[id];
	
			items[id] = { name: id, items: child.create_items() };
		}
		
		sorted = sort_dict(self.entries);
		
		for(var i = 0; i < sorted.length; i++)
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
		msg('Loaded ' + id);
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
				callback: app.onPluginInstantiated,
				animation: { show: 'show', hide: 'hide' },
				zIndex: 10000,
				items: items 
			});
  		}
	});
	
	this.create = function(id) {
		return new g_Plugins[id](self.core);
	}
}
 
function ConnectionUI(parent_conn)
{
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
	this.src_slot_div = null;
	this.dst_slot_div = null;
	this.color = '#000';
	this.parent_conn = parent_conn;
	this.offset = 0;
}

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	
	var self = this;
	
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
	}
}

function NodeUI(parent_node, x, y) {
	this.parent_node = parent_node;
	this.x = x;
	this.y = y;
	
	var render_slots = function(nid, col, slots, type)
	{
		for(var i = 0; i < slots.length; i++)
		{
			var s = slots[i];
			var div = make('div');
			
			div.attr('id', nid + (type === 0 ? 'si' : 'so') + i);
			div.text(s.name);
			div.addClass('pl_slot');
			div.disableSelection();
			div.definition = s;
			
			div.mouseenter(app.onSlotEntered(parent_node, s, div));
			div.mouseleave(app.onSlotExited(parent_node, s, div));
			div.mousedown(app.onSlotClicked(parent_node, s, div, type));
			
			col.append(div);
		}
	};
	
	var nid = 'n' + parent_node.uid;
	
	this.dom = make('table');
	this.dom.addClass('plugin');
	this.dom.addClass('ui-widget-content');
	this.dom.attr('id', nid);
	this.dom.mousemove(app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	this.dom.css('top', '' + y + 'px');
	this.dom.css('left', '' + x + 'px');
	
	this.dom.addClass('pl_layout');
	
	var h_row = make('tr');
	var h_cell = make('td');
	
	h_cell.text(parent_node.id);
	h_cell.attr('colspan', '3');
	h_cell.disableSelection();
	h_row.append(h_cell);
	h_row.addClass('pl_header');
	h_row.click(app.onNodeHeaderClicked);
	h_row.mouseenter(app.onNodeHeaderEntered(parent_node));
	h_row.mouseleave(app.onNodeHeaderExited);
	this.dom.append(h_row);
	
	this.header_row = h_row;
	
	var row = make('tr');
	
	this.dom.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.css('text-align', 'left');
	content_col.addClass('pui_col');
	output_col.css('text-align', 'right');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	render_slots(nid, input_col, parent_node.plugin.input_slots, 0);
	render_slots(nid, output_col, parent_node.plugin.output_slots, 1);
	
	var plugin = parent_node.plugin;
	
	if(plugin.create_ui)
		content_col.append(plugin.create_ui());

	this.dom.draggable({
		drag: app.onNodeDragged(parent_node)
    	});
	
	$('#canvas_parent').append(this.dom)
}

function Node(parent_graph, plugin_id, x, y) {
	var self = this;
	
	this.parent_graph = parent_graph;
	this.plugin = app.core.plugin_mgr.create(plugin_id);
	this.x = x;
	this.y = y;
	this.ui = null;
	this.id = app.core.plugin_mgr.keybyid[plugin_id];
	this.uid = parent_graph.get_node_uid();
	this.rendering_state = 0;
	
	// Decorate the slots with their index to make this immediately resolvable
	// from a slot reference, allowing for faster code elsewhere.
	// Additionally tagged with the type (0 = input, 1 = output) for similar reasons.
	
	for(var i = 0; i < this.plugin.input_slots.length; i++)
	{
		var s = this.plugin.input_slots[i];
		
		s.index = i;
		s.type = 0;
	}
		
	for(var i = 0; i < this.plugin.output_slots.length; i++)
	{
		var s = this.plugin.output_slots[i];
		
		s.index = i;
		s.type = 1;
	}
	
	this.create_ui = function()
	{
		self.ui = new NodeUI(self, self.x, self.y);
	};
	
	this.destroy_ui = function()
	{
		if(self.ui)
			self.ui.dom.remove();
		
		self.ui = null;
	};
	
	this.destroy = function()
	{
		var graph = self.parent_graph;
		var index = graph.nodes.indexOf(self);
		
		if(index != -1)
			graph.nodes.splice(index, 1);
		
		var pending = [];
		var conns = graph.connections;
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.src_node.uid === self.uid || c.dst_node.uid === self.uid)
				pending.push(c);
		}
		
		for(var i = 0; i < pending.length; i++)
			graph.destroy_connection(pending[i]);
		
		self.destroy_ui();
	}
	
	this.update_recursive = function(conns, delta_t)
	{
		if(self.rendering_state == 1)
			return;
		
		var uid = self.uid;
		var inputs = self.inputs = [];
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.dst_node.uid === uid)
				self.inputs.push(c);
		}
		
		for(var i = 0; i < inputs.length; i++)
		{
			var inp = inputs[i];
			
			inp.src_node.update_recursive(conns, delta_t);
			
			var value = inp.src_node.plugin.update_output(inp.src_slot.index);
			
			self.plugin.update_input(inp.dst_slot.index, value);
		}
		
		if(self.plugin.update_state)
			self.plugin.update_state(delta_t);
		
		self.rendering_state = 1;
	}
}


function Graph(parent_graph) {
	var self = this;
	
	this.parent_graph = parent_graph;
	this.nodes = [];
	this.connections = [];
	this.node_uid = 0;

	this.get_node_uid = function()
	{
		return self.node_uid++;
	};
	
	this.create_instance = function(plugin_id, x, y)
	{
		n = new Node(self, plugin_id, x, y);
		
		self.nodes.push(n);
		return n;
	};
	
	this.update = function(delta_t)
	{
		var nodes = self.nodes;
		var roots = [];
		
		for(var i = 0; i < nodes.length; i++)
		{
			var node = nodes[i];
			
			if(node.plugin.output_slots.length == 0)
				roots.push(node);
				
			node.rendering_state = 0;
		}
		
		for(var i = 0; i < roots.length; i++)
		{
			var root = roots[i];
			
			root.update_recursive(self.connections, delta_t);
		}
	};
	
	this.destroy_connection = function(c)
	{
		var index = self.connections.indexOf(c);
		
		if(index != -1)
			self.connections.splice(index, 1);
		
		c.src_slot.is_connected = false;
		c.dst_slot.is_connected = false;
	};
	
	this.find_connection_to = function(node, slot)
	{
		if(slot.type !== 0)
			return null;
		
		var conns = self.connections;
		var uid = node.uid;
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.dst_node.uid = uid && c.dst_slot == slot)
				return c;			
		}
		
		return null;
	};
	
	this.find_connections_from = function(node, slot)
	{
		if(slot.type !== 1)
			return [];
		
		var conns = self.connections;
		var uid = node.uid;
		var result = [];
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.src_node.uid === uid && c.src_slot === slot)
				result.push(c);			
		}
		
		return result;
	};
}

function Core() {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		SHADER: { id: 1, name: 'Shader' },
		TEXTURE: { id: 2, name: 'Texture' },
		COLOR: { id: 3, name: 'Color' }
	};
	
	this.renderer = new Renderer('#webgl-canvas');
	this.active_graph = this.root_graph = new Graph(null);
	this.abs_t = 0.0;
	this.delta_t = 0.0;
	
	this.update = function(abs_t, delta_t)
	{
		self.abs_t = abs_t;
		self.delta_t = delta_t;
		self.renderer.update();
		self.active_graph.update(delta_t);
	}
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
	this.src_node = null;
	this.dst_node = null;
	this.src_slot = null;
	this.src_slot_div = null;
	this.dst_slot = null;
	this.dst_slot_div = null;
	this.edit_conn = null;
	this.last_mouse_pos = [0, 0];
	this.current_state = this.state.STOPPED;
	this.interval = null;
	this.abs_time = 0.0;
	this.last_time = (new Date()).getTime();
	this.ctrl_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hover_node = null;
	this.scrollOffset = [0, 0];
	
	var self = this;
	
	this.getNIDFromSlot = function(id)
	{
		return parseInt(id.slice(1, id.indexOf('s')));
	};
	
	this.getSIDFromSlot = function(id)
	{
		return parseInt(id.slice(id.indexOf('s') + 2, id.length));
	};
	
	this.getSlotPosition = function(slot_div, type)
	{
		var o = slot_div.offset();
		var co = canvas_parent.offset();
		var so = self.scrollOffset;
		
		o.left -= co.left;
		o.top -= co.top;

		o.left += so[0];
		o.top += so[1];
		
		var x = type == 0 ? o.left : o.left + slot_div.width();
		
		return [x, o.top + (slot_div.height() / 2)];
	};
	
	this.onPluginInstantiated = function(id, opt)
	{	
		var pos = opt.$menu.offset();
		var cp = canvas_parent;
		var co = cp.offset();
		var node = self.core.active_graph.create_instance(id, (pos.left - co.left) + cp.scrollLeft(), (pos.top - co.top) + cp.scrollTop());
		
		node.create_ui();
	};
	
	this.onSlotClicked = function(node, slot, slot_div, type) { return function(e)
	{
		e.stopPropagation();
		
		if(!self.ctrl_pressed && type == 1)
		{
			self.src_node = node;
			self.src_slot = slot;
			self.src_slot_div = slot_div;
			self.edit_conn = new Connection(null, null, null, null);
			self.edit_conn.create_ui();
			self.edit_conn.ui.src_pos = self.getSlotPosition(slot_div, 1);
		
			var graph = self.core.active_graph;
			var ocs = graph.find_connections_from(node, slot);
			var offset = 0;
			
			ocs.sort(function(a, b) {
				return a.ui.offset < b.ui.offset ? - 1 : a.ui.offset > b.ui.offset ? 1 : 0;
			});
			
			for(var i = 0; i < ocs.length; i++)
			{
				var oc = ocs[i];
				
				oc.offset = i;

				if(oc.ui.offset != i)
				{
					offset = i;
					break;
				}
				
				offset = i + 1;
			}
			
			self.edit_conn.ui.offset = offset;
			slot_div.css('color', '#0f0');
		}
		
		if(self.ctrl_pressed)
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
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.dst_slot === hs || c.src_slot === hs)
			{
				c.ui.color = '#f00';
				self.hover_connections.push(c);
				dirty = true;
								
				if(hs.type == 0)
					break; // Early out if this is an input slot, but continue searching if it's an output slot. There might be multiple connections.
			}
		}
		
		if(dirty)
			self.updateCanvas();
	}
	
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
			for(var i = 0; i < hcs.length; i++)
				hcs[i].ui.color = '#000';

			self.hover_connections = [];
			self.updateCanvas();
		}
		
		if(self.dst_slot_div != null)
		{
			self.dst_slot_div.css('color', '#000');
			self.dst_slot_div = null;
		}

	}
	
	this.onSlotEntered = function(node, slot, slot_div) { return function(e)
	{
		if(self.src_slot)
		{
			self.dst_slot_div = slot_div;

			if(self.src_slot_div.definition.dt === slot.dt && !slot.is_connected) // Only allow connection if datatypes match and slot is unconnected.
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

		if(self.ctrl_pressed)
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
		var odd_scale = 0.84; // Where in the universe is this comming from?
		var c = conn.ui;
		var so = self.scrollOffset;
		var x1 = (c.src_pos[0] - so[0]) * odd_scale;
		var y1 = c.src_pos[1] - so[1];
		var x4 = (c.dst_pos[0] - so[0]) * odd_scale;
		var y4 = c.dst_pos[1] - so[1];
		var mx = (x1 + x4) / 2;
		var my = (y1 + y4) / 2;
		var x2 = Math.min(x1 + 10 + (c.offset * 5), mx);
		
		c2d.strokeStyle = c.color;
		c2d.beginPath();
		c2d.moveTo(x1, y1);
		c2d.lineTo(x2, y1);
		c2d.lineTo(x2, y4);
		c2d.lineTo(x4, y4);
		c2d.stroke();
	};
	
	this.updateCanvas = function()
	{
		var c = self.c2d;
		
		self.canvas[0].width = self.canvas[0].width;
		
		var conns = self.core.active_graph.connections;
		
		for(var i = 0; i < conns.length; i++)
			self.drawConnection(c, conns[i]);
		
		if(self.edit_conn)
		{
			self.edit_conn.ui.dst_pos = self.last_mouse_pos.slice(0);
			self.drawConnection(c, self.edit_conn);
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
			
			msg('New ' + c);

			c.create_ui();
			c.ui.src_pos = self.edit_conn.ui.src_pos.slice(0);
			c.ui.dst_pos = self.getSlotPosition(self.dst_slot_div);
			c.ui.src_slot_div = self.src_slot_div;
			c.ui.dst_slot_div = self.dst_slot_div;
			c.ui.offset = self.edit_conn.ui.offset;
			
			var graph = self.core.active_graph; 
			
			graph.connections.push(c);
			
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
			
			for(var i = 0; i < conns.length; i++)
			{
				var c = conns[i];
				
				if(c.src_node.uid == uid || c.dst_node.uid == uid)
				{
					c.ui.color = '#f00';
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
			self.hover_node.ui.header_row.css('background-color', '#dde'); // TODO: Ugly. All this belongs an a style sheet!
			self.hover_node = null;
			
			var hcs = self.hover_connections;
			
			if(hcs.length > 0)
			{
				for(var i = 0; i < hcs.length; i++)
					hcs[i].ui.color = '#000';

				self.updateCanvas();
			}
		}
	};

	this.removeHoverConnections = function()
	{
			var hcs = self.hover_connections;
		
			if(hcs.length > 0)
			{
				var graph = self.core.active_graph;
			
				for(var i = 0; i < hcs.length; i++)
				{
					var c = hcs[i];
					var p = c.dst_node.plugin;
					
					// Signal the destruction of the connection to the target
					if(p.disconnect_input)
						p.disconnect_input(c.dst_slot.index);
					
					graph.destroy_connection(c);
				}
				
				self.hover_connections = [];
				self.updateCanvas();
			}
	};
		
	this.onNodeHeaderEntered = function(node) { return function(e)
	{
		self.hover_node = node;

		if(self.ctrl_pressed)
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
		
		if(self.ctrl_pressed && self.hover_node !== null)
		{
			var hn = self.hover_node;
			
			self.releaseHoverNode();
			hn.destroy();
			
			self.updateCanvas();
			self.removeHoverConnections();
		}
		
		return false;
	};
	
	this.onNodeDragged = function(node) { return function(e)
	{
		var conns = self.core.active_graph.connections;
		var uid = node.uid;
		var canvas_dirty = false;
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			if(c.src_node.uid == uid)
			{
				c.ui.src_pos = self.getSlotPosition(c.ui.src_slot_div, 1);
				canvas_dirty = true;
			}
			else if(c.dst_node.uid == uid)
			{
				c.ui.dst_pos = self.getSlotPosition(c.ui.dst_slot_div, 0);
				canvas_dirty = true;
			}
		}
		
		if(canvas_dirty)
			self.updateCanvas();
	}};
	
	this.onKeyDown = function(e)
	{
		if(e.keyCode === 17) // .isCtrl doesn't work on Chrome.
		{
			self.ctrl_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
	};
	
	this.onKeyUp = function(e)
	{
		if(e.keyCode === 17)
		{
			self.ctrl_pressed = false;
			self.releaseHoverSlot();
			self.releaseHoverNode();
		}
	};

	this.changeControlState = function()
	{
		var cs = self.current_state;
		
		$('#play').button(cs == self.state.PLAYING ? 'disable' : 'enable');
		$('#pause').button(cs == self.state.PAUSED || cs == self.state.STOPPED ? 'disable' : 'enable');
		$('#stop').button(cs == self.state.STOPPED ? 'disable' : 'enable');
	}
	
	this.onPlayClicked = function()
	{
		self.current_state = self.state.PLAYING;
		self.changeControlState();
		
		self.last_time = (new Date()).getTime();
		self.interval = setInterval(function() {
			app.onUpdate();
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
	};

	this.onUpdate = function()
	{
		var time = (new Date()).getTime();
		var delta_t = (time - self.last_time) * 0.001;
		
		self.core.update(self.abs_time, delta_t);
		$('#frame').val(delta_t.toFixed(4));
		self.last_time = time;
		self.abs_time += delta_t;
	}
	
	$(document).mouseup(this.onMouseReleased);
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
	
	// If the user uses any of the existing browser CTRL hotkeys (like new tab!),
	// make sure we clear our hover state.
	$(window).blur(function()
	{
		self.ctrl_pressed = false;
		self.releaseHoverSlot();
		self.releaseHoverNode();
	});
	
	// Make sure all the input fields blur themselves when they gain focus --
	// otherwise they trap the control key document events.
	$('#play').focus(function(e) { $('#play').blur(); });
	$('#pause').focus(function(e) { $('#pause').blur(); });
	$('#stop').focus(function(e) { $('#stop').blur(); });
}

$(document).ready(function() {
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
	
	$('#dbg').ajaxError(function(e, jqxhr, settings, exception) {
		if(settings.dataType=='script') {
			msg(e + exception);
		}
	});

	app = new Application();
	app.core.plugin_mgr = new PluginManager(app.core, 'plugins');
	
	$('#play').button({ icons: { primary: 'ui-icon-play' } }).click(app.onPlayClicked);
	$('#pause').button({ icons: { primary: 'ui-icon-pause' }, disabled: true }).click(app.onPauseClicked);
	$('#stop').button({ icons: { primary: 'ui-icon-stop' }, disabled: true }).click(app.onStopClicked);

	$('#structure').jstree({
			// the `plugins` array allows you to configure the active plugins on this instance
			'plugins': ['themes', 'html_data', 'ui', 'crrm', 'hotkeys'],
			'themes': { 'theme': 'apple' }
			// each plugin you have included can have its own config object
			// "core" : { "initially_open" : [ "phtml_1" ] }
		})
		.bind('loaded.jstree', function(event, data) 
		{
			// you get two params - event & data - check the core docs for a detailed description
		});

  	msg('Ready.');
	
	$('#content').css('display', 'block');
});
