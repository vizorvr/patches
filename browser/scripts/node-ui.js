UIpoint = function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

NodeUI = function(parent_node, x, y, z) {
	var that = this

	this.parent_node = parent_node;
	this.selected = false;
	this.position = new UIpoint(x,y,z);
	this.x = x || 0;
	this.y = y || 0;
	this.sl = E2.app.scrollOffset[0];
	this.st = E2.app.scrollOffset[1];
	this.plugin_ui = null;
	this.dom 		= make('div');		// note plugins (e.g. subgraph) may attempt to add css classes to this
	this.header 	= make('div');		// occasionally this may contain a single input or output
	this.content 	= make('div');		// normally contains ins, outs, and plugin ui
	this.input_col 	= make('div');
	this.content_col = make('div');
	this.output_col = make('div');
	this.nid = 'n' + parent_node.uid;
	var nid = this.nid;
	var $dom = this.dom;

	$dom.addClass('vp graph-node plugin');
	$dom.attr('id', nid);
	$dom.mousemove(E2.app.onMouseMoved.bind(E2.app)); // Make sure we don't stall during slot connection, when the mouse enters a node.
	

	var $header = this.header;
	var toggle = make('button');
	var lbl = make('span');
	var header_wrap = make('div');

	toggle.addClass('plugin-toggle');
	toggle.append('<svg class="icon-arrow-vertical"><use xlink:href="#icon-arrow-vertical"/></svg>');
	toggle.click(function() {
		var isOpen = !that.parent_node.open

		E2.app.dispatcher.dispatch({
			actionType: 'uiNodeOpenStateChanged',
			graphUid: that.parent_node.parent_graph.uid,
			nodeUid: that.parent_node.uid,
			isOpen: isOpen
		})
	})

	this.parent_node.on('openStateChanged', function(isOpen) {
		that.setCssClass();
		that.parent_node.update_connections()
		E2.app.updateCanvas(true)
	})
	
	lbl.text(parent_node.get_disp_name());
	lbl.addClass('t p_title');
	header_wrap.append(toggle);
	header_wrap.append(lbl);
	$header.append(header_wrap);
	$header.addClass('p_header');

	$header.mousedown(E2.app.onNodeHeaderMousedown.bind(E2.app));
	$header.click(E2.app.onNodeHeaderClicked.bind(E2.app));
	$header.dblclick(this.showRenameControl.bind(this));
	$header.mouseenter(E2.app.onNodeHeaderEntered.bind(E2.app, parent_node));
	$header.mouseleave(E2.app.onNodeHeaderExited.bind(E2.app));

	if (parent_node.plugin.desc) {
		$header.attr('alt', '' + parent_node.uid);
		$header.hover(E2.app.onShowTooltip.bind(E2.app), E2.app.onHideTooltip.bind(E2.app));
	}

	$dom.append($header);

	var row = this.content;
	var input_col = this.input_col;
	var content_col = this.content_col
	var output_col = this.output_col;

	row.addClass('p_content');
	$dom.append(row)


	input_col.addClass('ic p_ins');
	content_col.addClass('cc pui_col p_plugin');
	output_col.addClass('oc p_outs');

	row.append(input_col)
	row.append(content_col)
	row.append(output_col)

	this.setCssClass();
	this.redrawSlots();

	var plugin = parent_node.plugin;
	
	if (plugin.create_ui) {
		this.plugin_ui = plugin.create_ui();
		content_col.append(this.plugin_ui);
	}
	else
		this.plugin_ui = {}; // We must set a dummy object so plugins can tell why they're being called.

	if (this.hasPreferences()) {	// create a preferences button and wire it up
		var inp_config = makeButton(null, 'Edit preferences', 'config_btn')
		inp_config.removeClass('btn');
		inp_config.click(function() {
			// TODO: dispatch event back to parent_node
			// flowdock:dev/messages/153196
			that.parent_node.plugin.open_preferences(that.parent_node.plugin);
			return false;
		})
		header_wrap.append(inp_config);
	}

	make_draggable($dom,
		E2.app.onNodeDragged.bind(E2.app, parent_node),
		E2.app.onNodeDragStopped.bind(E2.app, parent_node))
    	
	E2.dom.canvas_parent.append($dom);
	this.update();	// place in position;
//	this.parent_node.addListener('slotAdded', this.redrawSlots.bind(this));
//	this.parent_node.addListener('slotRemoved', this.redrawSlots.bind(this));

}

NodeUI.prototype.setSelected = function(is_selected) {
	this.selected = is_selected;
	this.setCssClass();
}
NodeUI.prototype.isSelected = function() { return !!this.selected; }

NodeUI.prototype.setCssClass = function() {
	var $dom = this.dom;
	if (this.parent_node.open) {
		$dom.addClass('p_expand').removeClass('p_collapse');
	} else {
		$dom.addClass('p_collapse').removeClass('p_expand');
	}

	(this.hasInputs()) ? $dom.addClass('p_has_ins') : $dom.removeClass('p_has_ins');
	(this.hasOutputs()) ? $dom.addClass('p_has_outs') : $dom.removeClass('p_has_outs');
	(this.isSelected()) ? $dom.addClass('p_selected') : $dom.removeClass('p_selected');

	return this;
}

NodeUI.prototype.redrawSlots = function() {
	// render inputs
	NodeUI.render_slots(this.parent_node, this.nid, this.input_col, this.parent_node.plugin.input_slots, E2.slot_type.input);
	if(this.parent_node.dyn_inputs)
		NodeUI.render_slots(this.parent_node, this.nid, this.input_col, this.parent_node.dyn_inputs, E2.slot_type.input);
	// render outputs
	NodeUI.render_slots(this.parent_node, this.nid, this.output_col, this.parent_node.plugin.output_slots, E2.slot_type.output);
	if(this.parent_node.dyn_outputs)
		NodeUI.render_slots(this.parent_node, this.nid, this.output_col, this.parent_node.dyn_outputs, E2.slot_type.output);
	return this;
};

NodeUI.prototype.hasInputs = function() {
	return (this.parent_node.plugin.input_slots.length + this.parent_node.dyn_inputs.length) > 0;
};

NodeUI.prototype.hasOutputs = function() {
	return (this.parent_node.plugin.output_slots.length + this.parent_node.dyn_outputs.length) > 0;
};

NodeUI.prototype.hasPreferences = function() {
	return (typeof this.parent_node.plugin.open_preferences == 'function');
}


NodeUI.prototype.setPosition = function(x, y, z) {
	if (typeof x != 'undefined') this.position.x = this.x = x;
	if (typeof y != 'undefined') this.position.y = this.y = y;
	if (typeof z != 'undefined') this.position.z = z;

	// until VP allows plugins to display at negative positions.
	if (this.position.x < 0) this.position.x = this.x = 0;
	if (this.position.y < 0) this.position.y = this.y = 0;

	this.update();
}

/**
 *  Stub. For now it just places the UI in position.
 */
NodeUI.prototype.update = function() {
	if (!this.dom) return;
	var s = this.dom[0].style;
	s.left = '' + this.position.x + 'px';
	s.top = '' + this.position.y + 'px';
}


NodeUI.prototype.showRenameControl = function() {
//	var that = this
	var node = this.parent_node;
	var $dom = this.dom;
	var input = $('<input class="node-title-input" placeholder="Type a title" />')

	input
		.appendTo($dom)
		.val(node.title || node.id)
		.keyup(function(e) {

			var code = e.keyCode || e.which

			if(code === 13) {

				var name = $(e.target).val().replace(/^\s+|\s+$/g,'') // remove extra spaces

				if (name === "") {
					if (node.id === "Graph") {
						// TODO: for preset subgraphs get the name of the preset.
						name = false;	// do not rename node for now
					}
					else name = node.id;
				}

				if (name) {
					E2.app.graphApi.renameNode(E2.core.active_graph, node, name);
				}

				input.remove();

			}
			else if(code === 27) {
				input.remove();
			}

		})
		.select()
		.bind('blur', function() {
			$(this).remove();	// this = input
		})
		.focus()
}

NodeUI.create_slot = function(parent_node, nid, container, s, type) {
	var $div = make('div');

	var is_input = (type === E2.slot_type.input);
	var is_dynamic = (typeof s.uid != 'undefined')
	var is_connected = (typeof s.is_connected != 'undefined') && s.is_connected;


	if (is_dynamic)
		$div.attr('id', nid + (is_input ? 'di' : 'do') + s.uid);
	else
		$div.attr('id', nid + (is_input ? 'si' : 'so') + s.index);


	$div.addClass('pl_slot p_slot');
	$div.addClass( (is_input) ? 'p_in' : 'p_out' );
	if (is_dynamic) $div.addClass('p_dynamic');
	if (is_connected) $div.addClass('p_connected');



	var $status = make('span');	// contains the two svg-s, on and off, loaded from sprite already in the document.
	$status.addClass('status');
	$status.append('<svg class="p_conn_status p_on"><use xlink:href="#vp-port-connected"/></svg>');
	$status.append('<svg class="p_conn_status p_off"><use xlink:href="#vp-port-unconnected"/></svg>');
	if (is_input) {
		$div.append($status);
		$div.append('<label>'+ s.name +'</label>');
	} else {
		$div.append('<label>'+ s.name +'</label>');
		$div.append($status);
	}


	$div.mouseenter(E2.app.onSlotEntered.bind(E2.app, parent_node, s, $div))
	$div.mouseleave(E2.app.onSlotExited.bind(E2.app, parent_node, s, $div))
	$div.mousedown(E2.app.onSlotClicked.bind(E2.app, parent_node, s, $div, type))

	var id = '' + parent_node.uid;
	
	id += '_' + (s.uid !== undefined ? 'd' : 's');
	id += type === E2.slot_type.input ? 'i' : 'o';
	id += '_' + (s.uid !== undefined ? s.uid : s.index);
	
	$div.attr('alt', id);
	$div.hover(E2.app.onShowTooltip.bind(E2.app), E2.app.onHideTooltip.bind(E2.app));
	container.append($div);
}

NodeUI.render_slots = function(parent_node, nid, col, slots, type) {
	for(var i = 0, len = slots.length; i < len; i++)
		NodeUI.create_slot(parent_node, nid, col, slots[i], type);
}
