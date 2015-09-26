UIpoint = function(x,y,z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
};


NodeUI = function(parent_node, x, y, z) {
	var that = this

	this.flags = {
		set				: false,
		has_subgraph	: false,
		has_plugin_ui 	: false,
		has_inputs 		: false,
		has_outputs 	: false,
		has_dynamic_slots : false,
		has_preferences : false,
		has_edit 		: false,
		single_in 		: false,
		single_out 		: false
	};

	/** @var Node */
	this.parent_node = parent_node;		// the node we represent
	this.selected = false;

	// use .setPosition() to modify these
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.position = new UIpoint(x,y,z);

	this.sl = E2.app.scrollOffset[0];
	this.st = E2.app.scrollOffset[1];
	this.plugin_ui = null;
	this.dom 		= make('div');		// plugins (e.g. subgraph) may attempt to add css classes to this
	this.header 	= make('div');		// occasionally this may contain a single input or output
	this.content 	= make('div');		// normally contains ins, outs, and the plugin ui/content
	this.input_col 	= make('div');
	this.content_col = make('div');
	this.output_col = make('div');
	this.inline_in = make('div');
	this.inline_out = make('div');
	this.nid = 'n' + parent_node.uid;
	var nid = this.nid;
	var $dom = this.dom;

	$dom.addClass('vp graph-node plugin');
	$dom.addClass('p_cat_' + this.getNodeCategory());
	$dom.addClass('p_id_' + this.parent_node.plugin.id);
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
	var inline_in = this.inline_in;
	var inline_out = this.inline_out;

	row.addClass('p_content');
	$dom.append(row)


	inline_in.addClass('ic p_ins');
	inline_out.addClass('oc p_outs');
	header_wrap.append(inline_out);

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

	if (this.hasSubgraph()) {	// create a preferences button and wire it up
		var $edit = NodeUI.makeSpriteSVGButton(
			NodeUI.makeSpriteSVG('vp-edit-patch-icon', 'cmd_edit_graph'), 'Edit nested patch'
		);
		$edit.addClass('fade');
		$edit.click(this.openSubgraph.bind(this));
		header_wrap.append($edit);
	}

	make_draggable($dom,
		E2.app.onNodeDragged.bind(E2.app, parent_node),
		E2.app.onNodeDragStopped.bind(E2.app, parent_node))
    	
	E2.dom.canvas_parent.append($dom);
	this.update();	// place in position;
//	this.parent_node.addListener('slotAdded', this.redrawSlots.bind(this));
//	this.parent_node.addListener('slotRemoved', this.redrawSlots.bind(this));

}

NodeUI.prototype.openInspector = function() {
	if (this.hasPreferences())
		this.parent_node.plugin.open_inspector(this.parent_node.plugin);
	return false;
};

NodeUI.prototype.openSubgraph = function() {
	if (this.hasSubgraph())
		NodeUI.drilldown(this.parent_node);
	else console.log('no');
	return false;
};

NodeUI.prototype.setSelected = function(is_selected) {
	this.selected = is_selected;
	this.setCssClass();
}
NodeUI.prototype.isSelected = function() { return !!this.selected; };

NodeUI.prototype.setCssClass = function() {
	var $dom = this.dom;

	if (this.canDisplayInline()) {
		$dom.removeClass('p_expand').removeClass('p_collapse').addClass('p_inline');
	} else {
		$dom.removeClass('p_inline');
		if (this.parent_node.open) {
			$dom.addClass('p_expand').removeClass('p_collapse');
		} else {
			$dom.addClass('p_collapse').removeClass('p_expand');
		}
	}

	var classIf = function(condition, className, $j) {
		if (typeof $j === 'undefined') $j = $dom;
		if (condition)
			$j.addClass(className);
		else
			$j.removeClass(className);
		return $j
	};
	classIf(this.hasInputs(), 'p_has_ins');
	classIf(this.hasOutputs(), 'p_has_outs');
	classIf(this.hasSingleInputOnly(), 'p_1in');
	classIf(this.hasSingleOutputOnly(), 'p_1out');
	classIf(this.canDisplayOutputInHeader(), 'p_header_out');
	classIf(this.canDisplayInputInHeader(), 'p_header_in');
	classIf(this.isSelected(), 'p_selected');

	return this;
};

NodeUI.prototype.getPluginUIFlags = function(reset) {
	if (typeof reset === 'undefined') reset = false;
	if (reset) this.flags.set = false;
	if (this.flags.set) return this.flags;
	this.flags.has_subgraph 	= this.hasSubgraph();
	this.flags.has_plugin_ui 	= this.hasPluginUI();
	this.flags.has_inputs 		= this.hasInputs();
	this.flags.has_outputs 		= this.hasOutputs();
	this.flags.has_preferences 	= this.hasPreferences();
	this.flags.has_dynamic_slots = this.hasDynamicSlots();
	this.flags.has_edit 		= this.hasEditButton();
	this.flags.single_in 		= this.hasSingleInputOnly();
	this.flags.single_out 		= this.hasSingleOutputOnly();
	this.flags.set = true;
	return this.flags;
};

NodeUI.prototype.canDisplayInputInHeader = function() {
	return false;
};

NodeUI.prototype.canDisplayOutputInHeader = function() {
	var p = this.getPluginUIFlags();
	var can = p.single_out && (!p.has_edit) && (!p.has_dynamic_slots);	// check !p.has_inputs if stricter
	can &= !p.has_subgraph;

	var allowedCategories = [uiNodeCategory.value, uiNodeCategory.material, uiNodeCategory.geometry, uiNodeCategory.light]; // initially
	var myCategory = this.getNodeCategory();
	can &= (allowedCategories.indexOf(myCategory) > -1);

	return can;
};

NodeUI.prototype.canDisplayInline = function() {
	var p = this.getPluginUIFlags();	// variables used to make a decision.

	var can = !p.has_plugin_ui;
	can &= !p.has_subgraph;
	can &= (this.getNodeCategory() === uiNodeCategory.io);
	can &= (p.single_in && !p.has_outputs) || (p.single_out && !p.has_inputs);

	return can;
};

NodeUI.prototype.redrawSlots = function() {
	var can_display_inline = this.canDisplayInline();
	var plugin_flags = this.getPluginUIFlags();

	// render inputs
	NodeUI.render_slots(this.parent_node, this.nid, this.input_col, this.parent_node.plugin.input_slots, E2.slot_type.input);
	if(this.parent_node.dyn_inputs)
		NodeUI.render_slots(this.parent_node, this.nid, this.input_col, this.parent_node.dyn_inputs, E2.slot_type.input);

	// render outputs

	if (this.canDisplayOutputInHeader()) {
		NodeUI.render_slots(this.parent_node, this.nid, this.inline_out, this.parent_node.plugin.output_slots, E2.slot_type.output);
		// just in case
		if(this.parent_node.dyn_outputs)
			NodeUI.render_slots(this.parent_node, this.nid, this.output_col, this.parent_node.dyn_outputs, E2.slot_type.output);
	} else {
		NodeUI.render_slots(this.parent_node, this.nid, this.output_col, this.parent_node.plugin.output_slots, E2.slot_type.output);
		if(this.parent_node.dyn_outputs)
			NodeUI.render_slots(this.parent_node, this.nid, this.output_col, this.parent_node.dyn_outputs, E2.slot_type.output);
	}
	return this;
};

NodeUI.prototype.hasSubgraph = function() {
	return (typeof this.parent_node.plugin.drilldown === 'function');
};

NodeUI.prototype.hasDynamicSlots = function() {
	return this.parent_node.dyn_inputs.length + this.parent_node.dyn_outputs.length > 0;
}

NodeUI.prototype.hasInputs = function() {
	return (this.parent_node.plugin.input_slots.length + this.parent_node.dyn_inputs.length) > 0;
};

NodeUI.prototype.hasOutputs = function() {
	return (this.parent_node.plugin.output_slots.length + this.parent_node.dyn_outputs.length) > 0;
};


NodeUI.prototype.hasPluginUI = function() {
	return (typeof this.parent_node.plugin.create_ui === 'function');
};

NodeUI.prototype.hasPreferences = function() {
	return (typeof this.parent_node.plugin.open_inspector === 'function');
};

// aliases
NodeUI.prototype.hasInspector = NodeUI.prototype.hasPreferences;

NodeUI.prototype.hasSingleInputOnly = function() {
	return (this.parent_node.plugin.input_slots.length === 1) && (this.parent_node.dyn_inputs.length === 0);
};

NodeUI.prototype.hasSingleOutputOnly = function() {
	return (this.parent_node.plugin.output_slots.length === 1) && (this.parent_node.dyn_outputs.length === 0);
};

NodeUI.prototype.hasEditButton = function() {
	return false;
};


NodeUI.prototype.setPosition = function(x, y, z) {
	if (typeof x != 'undefined') this.position.x = this.x = x;
	if (typeof y != 'undefined') this.position.y = this.y = y;
	if (typeof z != 'undefined') this.position.z = this.z = z;
	this.update();
};

/**
 *  Stub. For now it just places the UI in position.
 */
NodeUI.prototype.update = function() {
	if (!this.dom) return;
	var s = this.dom[0].style;

	var xx = this.position.x;
	var yy = this.position.y;

	// temporary fix for plugins appearing at -98px top, until VP allows plugins to display at negative positions.
	if (xx < 0) this.position.x = this.x = xx = 10;
	if (yy < 0) this.position.y = this.y = yy = 10;
	s.left = '' + xx + 'px';
	s.top = '' + yy + 'px';
};


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
};

// returns one of uiNodeCategory values for this.parent_node
NodeUI.prototype.getNodeCategory = function() {
	return uiNodeCategoryMap.getCategory(this.parent_node.plugin.id);
};

NodeUI.prototype.getDisplayName = function() {
	return this.parent_node.get_disp_name();
};

/**** "static" *****/

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
	$status.append(NodeUI.makeSpriteSVG('vp-port-connected', 'p_conn_status p_on'));
	$status.append(NodeUI.makeSpriteSVG('vp-port-unconnected', 'p_conn_status p_off'));
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
};

NodeUI.render_slots = function(parent_node, nid, container, slots, type) {
	for(var i = 0, len = slots.length; i < len; i++)
		NodeUI.create_slot(parent_node, nid, container, slots[i], type);
};

// open nested graph for editing
NodeUI.drilldown = function(node) {	// taken from nested graph plugin
	var p = node.plugin;
	if(p.graph) {
		var ptn = p.graph.parent_graph.tree_node

		if(!ptn.open) {
			ptn.graph.open = true
			ptn.rebuild_dom()
		}

		p.graph.tree_node.activate()
	}
	return false;
};

// helpers
/**
 * @returns jQuery
 */
NodeUI.makeSpriteSVG = function(xlink, className) {
	return $('<svg class="' + className + '"><use xlink:href="#'+ xlink +'"/></svg>');
};
/**
 * @returns jQuery
 */
NodeUI.makeSpriteSVGButton = function($svg, alt_text) {
	return makeButton(null, alt_text)
			.removeClass('btn')
			.addClass('vp svg')
			.append($svg);
};