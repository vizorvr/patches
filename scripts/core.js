var app = null;
var g_Plugins = {};

function msg(msg)
{
	var d = $("#dbg");

	d.append(msg + '\n');
	d.scrollTop(d[0].scrollHeight - d.height());
}

function make(tag)
{
	return $(document.createElement(tag));
}

function make_menu_plugin(id)
{
	var li = make('li');
	
	li.addClass('menu_item');
	
	var a = make('a');
	
	li.append(a);
	a.attr('href', '#' + id);
	a.text(id);
	
	return li;
}

function PluginManager(core, base_url) {
	this.base_url = base_url;
	this.core = core;

	var self = this;
	var plugs = [ "test_float_generator",
		      "test_string_generator",
		      "test_interval_generator",
		      "test_modulator",
		      "test_emitter" ]; // TODO: Get this from a JSON file (or something) in the root of the plugins dir.
	
	var menu = make('ul');
	
	for(var i = 0; i < plugs.length; i++) {
		var id = plugs[i];
		
		// Load the plugin, constrain filenames.
		url = self.base_url + "/" + id + ".plugin.js";
		
		$.getScript(url, (function(id) { return function(data, status) {
			if(status == "success")
			{	
				menu.append(make_menu_plugin(id))
				msg("Loaded " + id);
			}
			else
				msg("Failed to load plugin '" + id + "'");
		}})(id));  	
	}
	
	$('#context_menu').append(menu);
	$('#canvas').contextMenu({ menu: "context_menu" }, app.onPluginInstantiated);
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

			if(type === 1)
				div.mousedown(app.onSlotClicked(parent_node, s, div));
			
			col.append(div);
		}
	};
	
	var nid = 'n' + parent_node.uid;
	
	this.dom = make('div');
	this.dom.addClass('plugin');
	this.dom.addClass('ui-widget-content')
	this.dom.attr('id', nid);
	this.dom.mousemove(app.onMouseMoved); // Make sure we don't stall during slot connection, when the mouse enters a node.
	
	this.dom.css('top', '' + y + 'px');
	this.dom.css('left', '' + x + 'px');
	
	var table = make('table');
	
	table.addClass('pl_layout');
	this.dom.append(table);
	
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
	table.append(h_row);
	
	this.header_row = h_row;
	
	var row = make('tr');
	
	table.append(row)
	
	var input_col = make('td');
	var content_col = make('td');
	var output_col = make('td');
	
	input_col.css('text-align', 'left');
	content_col.css('width', '100%');
	output_col.css('text-align', 'right');
	
	row.append(input_col)
	row.append(content_col)
	row.append(output_col)
	
	render_slots(nid, input_col, parent_node.plugin.input_slots, 0);
	render_slots(nid, output_col, parent_node.plugin.output_slots, 1);
	
	content_col.append(parent_node.plugin.create_ui());
	
	this.dom.draggable({containment:'parent', drag: app.onNodeDragged(parent_node) });
	
	$("#canvas_parent").append(this.dom)
}

function Node(parent_graph, plugin_id, x, y) {
	var self = this;
	
	this.parent_graph = parent_graph;
	this.plugin = app.core.plugin_mgr.create(plugin_id);
	this.x = x;
	this.y = y;
	this.ui = null;
	this.id = plugin_id;
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
			
			if(c.dst_node.uid == uid)
				inputs.push(c);
		}
		
		for(var i = 0; i < inputs.length; i++)
		{
			var i = inputs[i];
			
			i.src_node.update_recursive(conns, delta_t);
			
			var value = i.src_node.plugin.update_output(i.src_slot.index);
			
			self.plugin.update_input(i.dst_slot.index, value);
		}
		
		if(self.plugin.update_state)
			self.plugin.update_state(delta_t);
	
		if(self.ui)
			self.ui.dom.css('background-color', '#0f0');
		
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
		{
			self.connections.splice(index, 1);
			msg('Destroying connection = ' + index);
		}
		
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
		
		msg('search ' + conns.length);
		
		for(var i = 0; i < conns.length; i++)
		{
			var c = conns[i];
			
			msg('uid = ' + uid + ', src_uid = ' + c.src_node.uid);
			if(c.src_node.uid === uid && c.src_slot === slot)
			{
				msg('found match');
				result.push(c);			
			}
		}
		
		return result;
	};
}

function Core() {
	var self = this;
	
	this.datatypes = {
		FLOAT: { id: 0, name: 'Float' },
		STRING: { id: 1, name: 'String' },
		TEXTURE: { id: 2, name: 'Texture' }
	};
	
	this.active_graph = this.root_graph = new Graph(null);
	
	this.update = function(delta_t)
	{
		self.active_graph.update(delta_t);
	}
}

function Application() {
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
	this.start_time = (new Date()).getTime();
	this.last_time = this.start_time;
	this.ctrl_pressed = false;
	this.hover_slot = null;
	this.hover_slot_div = null;
	this.hover_connections = [];
	this.hover_node = null;
	
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
		var co = canvas.offset();
		var x = type == 0 ? (o.left - co.left) : (o.left - co.left) + slot_div.width();
		
		return [x, (o.top - co.top) + (slot_div.height() / 2)];
	};
	
	this.onPluginInstantiated = function(action, el, pos)
	{	
		var node = self.core.active_graph.create_instance(action, pos.docX, pos.docY);
		
		node.create_ui();
	};
	
	this.onSlotClicked = function(node, slot, slot_div) { return function(e)
	{
		e.stopPropagation();
		
		if(!self.ctrl_pressed)
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
		else
		{
			self.onMousePressed(e);
		}
				
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
		var c = conn.ui;
		var x1 = c.src_pos[0];
		var y1 = c.src_pos[1];
		var x4 = c.dst_pos[0];
		var y4 = c.dst_pos[1];

		var mx = (x1 + x4) / 2;
		var my = (y1 + y4) / 2;
	
		var x2 = Math.min(x1 + 10 + (c.offset * 3), mx);
		
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
			var c_o = self.canvas.offset();
			var m_r = [self.last_mouse_pos[0] - c_o.left, self.last_mouse_pos[1] - c_o.top];
		
			self.edit_conn.ui.dst_pos = m_r.slice(0);
			self.drawConnection(c, self.edit_conn);
		}
	};
	
	this.onMouseMoved = function(e)
	{
		if(self.src_slot)
			self.updateCanvas();
			
		self.last_mouse_pos = [e.pageX, e.pageY];
	};
	
	this.onMouseReleased = function(e)
	{
		if(self.dst_node && self.dst_slot) // If dest_slot is set, we should create a permanent connection.
		{
			var ss = self.src_slot;
			var ds = self.dst_slot;
			var c = new Connection(self.src_node, self.dst_node, ss, ds);
			
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

	this.onMousePressed = function(e)
	{
		var hcs = self.hover_connections;
		
		if(hcs.length > 0)
		{
			var graph = self.core.active_graph;
			
			for(var i = 0; i < hcs.length; i++)
				graph.destroy_connection(hcs[i]);
			
			self.hover_connections = [];
			self.updateCanvas();
		}
	}
	
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
	
	this.onKeyPressed = function(e)
	{
		if(e.ctrlKey)
		{
			self.ctrl_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
	};
	
	this.onKeyReleased = function(e)
	{
		if(e.ctrlKey)
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
		
		self.start_time = (new Date()).getTime();
		self.last_time = self.start_time;
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
		
		self.core.update(delta_t);
		$('#frame').val(delta_t.toFixed(4));
		self.last_time = time;
	}
	
	$(document).mouseup(this.onMouseReleased);
	$(document).mousedown(this.onMousePressed);
	$(document).keydown(this.onKeyPressed);
	$(document).keyup(this.onKeyReleased);
	canvas.mousemove(this.onMouseMoved);
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

	msg("Welcome to WebFx. " + (new Date()));
	
	$("#dbg").ajaxError(function(e, jqxhr, settings, exception) {
		if(settings.dataType=='script') {
			msg(e + exception);
		}
	});

	app = new Application();
	app.core.plugin_mgr = new PluginManager(app.core, 'plugins');
	
	$('#play').button({ icons: { primary: "ui-icon-play" } }).click(app.onPlayClicked);
	$('#pause').button({ icons: { primary: "ui-icon-pause" }, disabled: true }).click(app.onPauseClicked);
	$('#stop').button({ icons: { primary: "ui-icon-stop" }, disabled: true }).click(app.onStopClicked);

	$("#structure")
		.jstree({
			// the `plugins` array allows you to configure the active plugins on this instance
			"plugins" : ["themes","html_data","ui","crrm","hotkeys"],
			// each plugin you have included can have its own config object
			// "core" : { "initially_open" : [ "phtml_1" ] }
		})
		.bind("loaded.jstree", function (event, data) {
			// you get two params - event & data - check the core docs for a detailed description
		});

  	msg("Ready.");
	
	$('#content').css('display', 'block');
});
