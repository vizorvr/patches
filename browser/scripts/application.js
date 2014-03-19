function Application() {
	var self = this;
	var canvas_parent = $("#canvas_parent");
	var canvas = $("#canvas");
		
	this.state = {
		STOPPED: 0,
		PLAYING: 1,
		PAUSED: 2
	};
	
	this.preset_mgr = new PresetManager('presets');
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
	this.is_osx = /os x 10/.test(navigator.userAgent.toLowerCase());
	this.condensed_view = false;
	this.collapse_log = true;
	
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
	
	this.getSlotPosition = function(node, slot_div, type, result)
	{
		var area = node.open ? slot_div : node.ui.dom;
		var o = self.offsetToCanvasCoord(area.offset());
	
		result[0] = Math.round(type == E2.slot_type.input ? o[0] : o[0] + area.width() + (node.open ? 0 : 5));
		result[1] = Math.round(o[1] + (area.height() / 2));
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
				node.plugin.graph = new Graph(
					self.player.core,
					node.parent_graph,
					node.parent_graph.tree_node.add_child(name)
				);
				
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
		
			inp.css({
				'width': '240px',
				'border': '1px solid #999'
			});
		
			diag.append(inp);
		
			self.player.core.create_dialog(diag, 'Name new graph.', 240, 170, function()
			{
				createPlugin(inp.val());
			},
			function()
			{
				inp.focus().select();
			});
		}
		else if(id === 'loop')
			createPlugin('Loop');
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
			
			self.getSlotPosition(node, slot_div, E2.slot_type.output, self.edit_conn.ui.src_pos);
		
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
			slot_div[0].style.color = '#080';
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
				slot_div[0].style.color = '#080';
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
	
	this.mouseEventPosToCanvasCoord = function(e, result)
	{
		var cp = canvas_parent[0];
		
		result[0] = (e.pageX - cp.offsetLeft) + self.scrollOffset[0];
		result[1] = (e.pageY - cp.offsetTop) + self.scrollOffset[1];
	};
	
	this.onMouseReleased = function(e)
	{
		var changed = false;
		
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
			self.getSlotPosition(self.dst_node, self.dst_slot_div, E2.slot_type.input, c.ui.dst_pos);
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
			changed = true;
		}

		if(self.src_slot)
		{
			self.src_slot_div[0].style.color = '#000';
			self.src_slot = null;
			self.src_slot_div = null;
			changed = true;
		}
		
		self.dst_node = null;
		self.src_node = null;
		self.edit_conn = null;
		
		if(changed)
			self.updateCanvas(true);
		else
			E2.dom.structure.tree.on_mouse_up();
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

			iterate_conns(hcs, self.hover_node.uid);
			
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
	
		inp.css({
			'width': '240px',
			'border': '1px solid #999'
		});
		
		diag.append(inp);
	
		var done_func = function()
		{
			node.title = inp.val();
		
			if(node.ui !== null)
			{
				node.ui.dom.find('.t').text(node.title);
				
				if(node.update_connections())
					E2.app.updateCanvas(true);
			}
			
			if(node.plugin.e2_is_graph)
				node.plugin.graph.tree_node.set_title(node.title);
		
			if(node.plugin.renamed)
				node.plugin.renamed();
				
			node.parent_graph.emit_event({ type: 'node-renamed', node: node });
		};
		
		self.player.core.create_dialog(diag, 'Rename node.', 240, 170, done_func,
			function()
			{
				inp.focus().select();
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
		var conns = [];
		var gconns = function(n, coll)
		{
			for(var i = 0, len = n.inputs.length; i < len; i++)
			{
				var c = n.inputs[i];
			
				if(!(c in coll))
					coll.push(c);
			}

			for(var i = 0, len = n.outputs.length; i < len; i++)
			{
				var c = n.outputs[i];
			
				if(!(c in coll))
					coll.push(c);
			}
		};
		
		node.x += dx;
		node.y += dy;
		
		var dirty = node.update_connections();
		
		if(self.isNodeInSelection(node))
		{
			var sn = self.selection_nodes;
			var conns = [];
			
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
				gconns(n, conns);
			}
		}
		
		if(dirty || conns.length)
		{
			var gsp = E2.app.getSlotPosition;
			
			for(var i = 0, len = conns.length; i < len; i++)
			{
				var cn = conns[i];
				var c = cn.ui;
				
				gsp(cn.src_node, c.src_slot_div, E2.slot_type.output, c.src_pos);
				gsp(cn.dst_node, c.dst_slot_div, E2.slot_type.input, c.dst_pos);
			}
			
			self.updateCanvas(true);
		}
	}};
	
	this.onNodeDragStopped = function(node) { return function(e)
	{
		self.onNodeDragged(node)(e);
		self.in_drag = false;
	}};
	
	this.clearSelection = function()
	{
		var sn = self.selection_nodes;
		var sc = self.selection_conns;
		
		for(var i = 0, len = sn.length; i < len; i++)
		{
			var nui = sn[i].ui;
			
			if(nui)
			{
				nui.selected = false;
				nui.dom[0].style.border = '1px solid #444';
			}
		}
			
		for(var i = 0, len = sc.length; i < len; i++)
		{
			var cui = sc[i].ui;
			
			if(cui) 
				cui.selected = false;
		}

		self.selection_nodes = [];
		self.selection_conns = [];
		
		this.onHideTooltip();
	};
	
	this.onCanvasMouseDown = function(e)
	{
		if($(e.target).attr('id') !== 'canvas')
			return;
		
		if(e.which === 1)
		{
			self.selection_start = [0, 0];
			self.mouseEventPosToCanvasCoord(e, self.selection_start);
			self.selection_end = self.selection_start.slice(0);
			self.selection_last = [e.pageX, e.pageY];
			self.clearSelection();
			self.selection_dom = E2.dom.canvas_parent.find(':input').addClass('noselect'); //.attr('disabled', 'disabled');
		}
		else
		{
			self.releaseSelection();
			self.clearSelection();
			E2.app.updateCanvas();
		}
		
		self.in_drag = true;
		self.updateCanvas(false);
	};
	
	this.releaseSelection = function()
	{
		self.selection_start = null;
		self.selection_end = null;
		self.selection_last = null;
		
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
		
		// Clear focus to prevent problems with the user dragging over text areas (bringing them in focus) during selection.
		if(document.activeElement)
    			document.activeElement.blur();
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

			self.mouseEventPosToCanvasCoord(e, self.edit_conn.ui.dst_pos);
			self.updateCanvas(true);
		}
		else if(!self.selection_start)
		{
			E2.dom.structure.tree.on_mouse_move(e);
			return;
		}
		
		self.mouseEventPosToCanvasCoord(e, self.selection_end);
		
		var nodes = self.player.core.active_graph.nodes;
		var cp = E2.dom.canvas_parent;
		
		var ss = self.selection_start.slice(0);
		var se = self.selection_end.slice(0);
		
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
		var ns = [];
		
		for(var i = 0, len = sn.length; i < len; i++)
			sn[i].ui.selected = false;

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
				
			if(!n.ui.selected)
			{
				n.ui.dom[0].style.border = '2px solid #09f';
				n.ui.selected = true;
				ns.push(n);
			}
		}
		
		for(var i = 0, len = sn.length; i < len; i++)
		{
			var n = sn[i];
			
			if(!n.ui.selected)
				n.ui.dom[0].style.border = '1px solid #444';
		}
		
		self.selection_nodes = ns;
		
		var co = cp.offset();
		var w = cp.width();
		var h = cp.height();
		var dx = e.pageX - self.selection_last[0];
		var dy = e.pageY - self.selection_last[1];

		if((dx < 0 && e.pageX < co.left + (w * 0.15)) || (dx > 0 && e.pageX > co.left + (w * 0.85)))
			cp.scrollLeft(self.scrollOffset[0] + dx);
		
		if((dy < 0 && e.pageY < co.top + (h * 0.15)) || (dy > 0 && e.pageY > co.top + (h * 0.85)))
			cp.scrollTop(self.scrollOffset[1] + dy);
		
		self.selection_last[0] = e.pageX;
		self.selection_last[1] = e.pageY;
		
		self.updateCanvas(true);
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
		msg('Copy.');
		// msg(self.clipboard);
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

		msg('Cut.');
		
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
		
		msg('Paste.');
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
			node.x = Math.floor((node.x - d.x1) + bw2);
			node.y = Math.floor((node.y - d.y1) + bh2);

			if(!n.deserialise(ag.uid, node))
				continue;
			
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

			n.plugin.graph.tree_node = n.parent_graph.tree_node.add_child(n.title);
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
		{
			var cui = self.selection_conns[i].ui;
			
			cui.resolve_slot_divs();
			E2.app.getSlotPosition(cui.parent_conn.src_node, cui.src_slot_div, E2.slot_type.output, cui.src_pos);
			E2.app.getSlotPosition(cui.parent_conn.dst_node, cui.dst_slot_div, E2.slot_type.input, cui.dst_pos);
		}
		
		if(d.conns.length)
			self.updateCanvas(false);
	};

	this.selectAll = function()
	{
		self.clearSelection();
		
		var ag = self.player.core.active_graph;
		var s_nodes = self.selection_nodes;
		var s_conns = self.selection_conns;
		
		for(var i = 0, len = ag.nodes.length; i < len; i++)
		{
			var n = ag.nodes[i];
			
			n.ui.dom[0].style.border = '2px solid #09f';
			n.ui.selected = true;
			s_nodes.push(n);
		}
		
		for(var i = 0, len = ag.connections.length; i < len; i++)
		{
			var c = ag.connections[i];
			
			c.ui.selected = true;
			s_conns.push(c);
		}

		self.updateCanvas(true);
	};
	
	this.onWindowResize = function()
	{
		// More hackery
		E2.dom.canvas[0].width = E2.dom.canvas_parent[0].clientWidth;
		E2.dom.canvas[0].height = E2.dom.canvas_parent[0].clientHeight;

		if(self.player)
			self.updateCanvas(true);
	};


	this.onKeyDown = function(e)
	{
		function is_text_input_in_focus() {
			var rx = /INPUT|SELECT|TEXTAREA/i;
			return (rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly);
		}

		if(e.keyCode === 8) // prevent backspace from going back
		{
			if(!is_text_input_in_focus())
				e.preventDefault();
		}
		else if(e.keyCode === 9) // tab to focus to presets search
		{
			if (!is_text_input_in_focus())
				$('input', E2.dom.presets).focus();

			e.preventDefault();
		}
		else if(e.keyCode === (this.is_osx ? 91 : 17))  // CMD on OSX, CTRL on everything else
		{
			self.ctrl_pressed = true;
		}
		else if(e.keyCode === 16) // .isShift doesn't work on Chrome. This does.
		{
			self.shift_pressed = true;
			self.activateHoverSlot();
			self.activateHoverNode();
		}
		else if(e.keyCode === 32)
		{
			if(rx.test(e.target.tagName))
				return;
			
			if(self.player.current_state === self.player.state.PLAYING)
			{
				if(self.ctrl_pressed)
					self.onPauseClicked();
				else
					self.onStopClicked();
			}
			else
			{
				self.onPlayClicked();
			}
			
			e.preventDefault();
			return false;
		}
		else if(self.ctrl_pressed)
		{
			if(e.keyCode === 65) // CTRL+a
			{
				self.selectAll();
				e.preventDefault(); // FF uses this combo for opening the bookmarks sidebar.
				return;
			}
			if(e.keyCode === 66) // CTRL+b
			{
				self.condensed_view = !self.condensed_view;
				E2.dom.left_nav.toggle(!self.condensed_view);
				
				if(self.condensed_view)
					E2.dom.dbg.toggle(false);
				else if(!self.collapse_log)
					E2.dom.dbg.toggle(true);
				
				self.onWindowResize();
				e.preventDefault(); // FF uses this combo for opening the bookmarks sidebar.
				return;
			}
			else if(e.keyCode === 76) // CTRL+l
			{
				self.collapse_log = !self.collapse_log;
				E2.dom.dbg.toggle(!self.collapse_log);
				self.onWindowResize();
				e.preventDefault();
				return;
			}

			if(is_text_input_in_focus())
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
		if(e.keyCode === (this.is_osx ? 91 : 17)) // CMD on OSX, CTRL on everything else
		{
			self.ctrl_pressed = false;
		}
		else if(e.keyCode === 16)
		{
			self.shift_pressed = false;
			self.releaseHoverSlot();
			self.releaseHoverNode(false);
		}
	};

	this.changeControlState = function()
	{
		var s = self.player.state;
		var cs = self.player.current_state;

		if (cs !== s.PLAYING) {
			E2.dom.play.removeClass('disabled')
			E2.dom.pause.addClass('disabled')
			E2.dom.stop.addClass('disabled')
		} else {
			E2.dom.play.addClass('disabled')
			E2.dom.pause.removeClass('disabled')
			E2.dom.stop.removeClass('disabled')
		}
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
		self.player.schedule_stop(self.changeControlState);
	};

	this.onLayoutClicked = function()
	{
		var spc = 10; // pixels
		var nodes = self.player.core.active_graph.nodes;
		var data = [];
		var intersect = false;
		var pass = 0;
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var d = nodes[i].ui.dom[0];
			var dat = {
				x: d.offsetLeft,
				y: d.offsetTop,
				w: d.clientWidth,
				h: d.clientHeight,
				r2: d.clientWidth + d.clientHeight
			};
			
			data.push(dat);
			nodes[i].data = dat;
		}

		
		do
		{
			for(var i = 0, len = nodes.length; i < len; i++)
			{
				var id = data[i];
				var ind = nodes[i];

				if(ind.outputs.length === 1 && ind.inputs.length === 0)
				{
					var con = ind.outputs[0];
					var dat = con.dst_node.data;
					var tgt_x = dat.x + dat.w - 20 - (con.offset * 10);

					id.x += (tgt_x - id.x) / 40;
				}
				
				for(var c = 0, clen = ind.inputs.length; c < clen; c++)
				{
					var con = ind.inputs[c];
					var dat = con.src_node.data;
					var tgt_x = dat.x + dat.w + 20 + (con.offset * 10);
					var tgt_y = dat.y + 16 + (con.src_slot.index * 16);
					var nx = id.x < tgt_x ? tgt_x - id.x : -1;
					var ny = id.y < tgt_y ? 5 : -5;
				
					id.x += nx;
					id.y += ny;
				}
			
				for(var i2 = 0, len2 = nodes.length; i2 < len2; i2++)
				{
					if(i === i2)
						continue;
					
					var i2d = data[i2];
					var n_x = id.x - i2d.x;
					var n_y = id.y - i2d.y;
					var ind2 = nodes[i2];

					if(((i2d.x >= id.x - spc && i2d.x <= (id.x + id.w + spc)) || (id.x >= i2d.x - spc && id.x <= (i2d.x + i2d.w + spc))) &&
					   ((i2d.y >= id.y - spc && i2d.y <= (id.y + id.h + spc)) || (id.y >= i2d.y - spc && id.y <= (i2d.y + i2d.h + spc))))
					{
						i2d.x += Math.floor(-n_x * 0.15);
						i2d.y += Math.floor(-n_y * 0.15);
					}
					
					i2d.x = i2d.x < 5 ? 5 : i2d.x;
					i2d.y = i2d.y < 5 ? 5 : i2d.y;
				}
			}
			
			pass++;
		}
		while(pass < 20);

		var mx = 10000000;
		var my = 10000000;
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var d = data[i];
			
			mx = d.x < mx ? d.x : mx;
			my = d.y < my ? d.y : my;
		}
		
		mx -= 10;
		my -= 40;
		
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			var n = nodes[i];
			var d = n.ui.dom[0];
			var dt = data[i];
			
			n.x = Math.floor((Math.floor(dt.x) - mx) / 5) * 5;
			n.y = Math.floor((Math.floor(dt.y) - my) / 5) * 5;
			
			d.style.left = '' + n.x + 'px';
			d.style.top = '' + n.y + 'px';
			delete n.data;
		}
		
		var conns = self.player.core.active_graph.connections;
		
		for(var i = 0, len = conns.length; i < len; i++)
			conns[i].ui.resolve_slot_divs();
		
		canvas_parent.scrollLeft(0);
		canvas_parent.scrollTop(0);
		self.updateCanvas(true);
	};

	this.onOpenClicked = function()
	{
		FileSelectControl
			.createForUrl(URL_GRAPHS, null, 'Open', function(file)
			{
				window.location.hash = '#' + URL_GRAPHS + file;
			})
	};

	this.onSaveClicked = function()
	{
		$.get(URL_GRAPHS, function(files)
		{
			var wh = window.location.hash

			return new FileSelectControl()
				.buttons({
					'Cancel': function() {},
					'Save': function(filename) {
						if (!filename)
							return alert('Please enter a filename')

						if (!/\.json$/.test(filename))
							filename = filename + '.json'

						var ser = self.player.core.serialise();

						$.ajax({
							type: 'POST',
							url: URL_GRAPHS + filename,
							data: ser,
							dataType: 'json',
							success: function() {
								window.location.hash = '#' + URL_GRAPHS + filename;
							},
							error: function(_x, _t, err) {
								alert('error '+err);
							}
						});
					}
				})
				.selected(wh.substring(wh.lastIndexOf('/') + 1))
				.files(files)
				.modal()
		})
	};
	
	this.onLoadClicked = function()
	{
		window.location.hash = '#' + URL_GRAPHS + E2.dom.filename_input.val();
	};

	this.onLoadClipboardClicked = function()
	{
		var url = URL_GRAPHS + E2.dom.filename_input.val();

		$.get(url, function(d) {
			self.fillCopyBuffer(d.root.nodes, d.root.conns, 0, 0);
		});
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
		i_txt = i_txt.replace('<break>', '<br/><br/>');
		
		E2.dom.info.html(i_txt);
		E2.dom.info.css('min-height', 'auto');

		var heightNow = E2.dom.info.height();
		var missing = E2.dom.info[0].scrollHeight - E2.dom.info[0].offsetHeight;
		
		if(missing > 0)
			E2.dom.info.css('min-height', heightNow + missing + 12);
	};
	
	this.onHideTooltip = function()
	{
		if(self.in_drag)
			return false;

		E2.dom.info.css('min-height', 'auto');

		E2.dom.info.html('<b>Info view</b><br /><br />Hover over node instances or their slots to display their documentation here.');
	};
	
   	document.addEventListener('mouseup', this.onMouseReleased);
	document.addEventListener('mousemove', this.onMouseMoved);
	window.addEventListener('keydown', this.onKeyDown);
	window.addEventListener('keyup', this.onKeyUp);
	
	canvas_parent[0].addEventListener('scroll', function()
	{
		self.scrollOffset = [ canvas_parent.scrollLeft(), canvas_parent.scrollTop() ];
		var s = canvas[0].style;
		
		s.left = '' + self.scrollOffset[0] + 'px';
		s.top = '' + self.scrollOffset[1] + 'px';
		self.updateCanvas(true);
	});
	
	canvas_parent[0].addEventListener('mousedown', this.onCanvasMouseDown);
	document.addEventListener('mouseup', this.onCanvasMouseUp);
	
	// Clear hover state on window blur. Typically when the user switches
	// to another tab.
	window.addEventListener('blur', function()
	{
		self.shift_pressed = false;
		self.ctrl_pressed = false;
		self.releaseHoverSlot();
		self.releaseHoverNode(false);
	});
	
	window.addEventListener('resize', function(self) { return function()
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
		btn[0].addEventListener('keydown', this.onKeyDown);
		btn[0].addEventListener('keyup', this.onKeyUp);
	};
	
	add_button_events(E2.dom.play);
	add_button_events(E2.dom.pause);
	add_button_events(E2.dom.stop);
	add_button_events(E2.dom.save);
	add_button_events(E2.dom.open);
	
	// Ask user for confirmation on page unload
	/*$(window).bind('beforeunload', function()
	{
		return 'Oh... Please don\'t go.';
	});*/

	$('button#fullscreen').click(function()
	{
		self.player.core.renderer.set_fullscreen(true);
	});
	
	$('button#help').click(function()
	{
		window.open('help/introduction.html', 'Engi Help');
	});
	
	this.onHideTooltip();
}

