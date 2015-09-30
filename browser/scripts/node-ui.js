function UIpoint(x,y,z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

var uiNodeCategoriesThatNormallyDisplayInputInHeader = [];
var uiNodeCategoriesThatNormallyDisplayOutputInHeader = [
	uiNodeCategory.value,
	uiNodeCategory.material,
	uiNodeCategory.geometry,
	uiNodeCategory.light,
	uiNodeCategory.texture
]



function NodeUI(parent_node, x, y, z) {
	EventEmitter.call(this);
	var that = this

	this.nid = 'n' + parent_node.uid;
	this._id = E2.uid();
	this._destroying = false;
	this._destroyed = false;
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

	this._ttdata = null;		// used for tooltip switching

	/** @var Node */
	this.parent_node = parent_node;		// the node we represent
	this.selected = false;

	/* jQueries */
	this.input_col = null;
	this.output_col = null;
	this.inline_in = null;
	this.inline_out = null;
	this.header = null;
	this.content = null;
	this.plugin_container = null;
	this.plugin_ui = null;

	// use .setPosition() to modify these
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.position = new UIpoint(x,y,z);

	this.sl = E2.app.scrollOffset[0];
	this.st = E2.app.scrollOffset[1];

	this.dom 		= make('div');	// plugins (e.g. subgraph) may attempt to add css classes to this. ideally they shouldn't

	// INIT TEMPLATE

	var viewdata = {
		inline_in: 		null,
		inline_out: 	null,
		toggle_control: null,
		edit_control: 	null,
		node_title: 	null,
		plugin_inputs: 	null,
		plugin_outputs: null,
		plugin_content : null
	};

	viewdata.node_title = make('span').text(parent_node.get_disp_name()).html();

	// RENDER THE TEMPLATE

	var $dom 	= this.dom;
	var $header, $content, $edit, $toggle;

	var handlebar = null;
	if (typeof E2.views.patch_editor !== 'undefined') {
		var template_name = 'ui_plugin_' + this.parent_node.plugin.id;
		if (typeof E2.views.patch_editor[template_name] !== 'undefined')
			handlebar = E2.views.patch_editor[template_name];
		else
			handlebar = E2.views.patch_editor['ui_plugin__default']
	}
	if (handlebar) {
		/* @var $dom jQuery */
		$dom.html(handlebar(viewdata));
		$header = this.header = $dom.children('.p_header').first();
		$content = this.content = $dom.children('.p_content').first();	// normally contains ins, outs, and the plugin ui/content
		$toggle = $header.find('button.toggle').first();
		$edit = $header.find('button.edit').first();
		this.inline_in = $header.find('.p_ins').first();
		this.inline_out = $header.find('.p_outs').first();
		this.input_col = $content.find('.p_ins').first();
		this.output_col = $content.find('.p_outs').first();
		this.plugin_container = $dom.find('.p_plugin').first();
	} else {
		// recover
		$header = this.header 	= make('div');
		$content = this.content = make('div');
		this.input_col 			= make('div');
		this.plugin_container 	= make('div');
		this.output_col 		= make('div');
		this.inline_in 			= make('div');
		this.inline_out 		= make('div');
		$toggle = make('button');
		$edit = make('button');
		$header.append($toggle, $edit);
		$dom.append($header.append(this.inline_in, this.inline_out), $content.append(this.input_col, this.plugin_container, this.output_col));
	}

	// ATTACH HANDLERS ETC

	var plugin = parent_node.plugin;
	if (plugin.create_ui) {
		this.plugin_ui = plugin.create_ui();
		this.plugin_container.append(this.plugin_ui);
	}
	else
		this.plugin_ui = {}; // We must set a dummy object so plugins can tell why they're being called.

	if (this.hasSubgraph()) {	// create a preferences button and wire it up
		NodeUI.makeSpriteSVGButton(
			NodeUI.makeSpriteSVG('vp-edit-patch-icon', 'cmd_edit_graph'),
			'Edit nested patch',
			$edit
		);
		$edit.addClass('p_fade');
		$edit.click(this.openSubgraph.bind(this));
	} else {
		$edit.remove();
	}

	$toggle.append('<svg class="icon-arrow-vertical"><use xlink:href="#icon-arrow-vertical"/></svg>');
	$toggle.addClass('plugin-toggle');
	$toggle.click(function() {
		var isOpen = !that.parent_node.open

		E2.app.dispatcher.dispatch({
			actionType: 'uiNodeOpenStateChanged',
			graphUid: that.parent_node.parent_graph.uid,
			nodeUid: that.parent_node.uid,
			isOpen: isOpen
		})
	});

	var myCategory = this.getNodeCategory();
	$dom.addClass('vp graph-node plugin');
	$dom.addClass('p_cat_' + myCategory);
	$dom.addClass('p_id_' + this.parent_node.plugin.id);
	$dom.attr('id', this.nid);
	$dom.data('uiid', this._id).attr('data-uiid', this._id);
	$dom.data('nuid', this.parent_node.uid).attr('data-nuid', this.parent_node.uid);
	$dom.data('cat', myCategory).attr('data-cat', myCategory);
	E2.dom.canvas_parent.append($dom);


	$dom.mousemove(E2.app.onMouseMoved.bind(E2.app)); // Make sure we don't stall during slot connection, when the mouse enters a node.

	$header.mousedown(E2.app.onNodeHeaderMousedown.bind(E2.app));
	$header.click(E2.app.onNodeHeaderClicked.bind(E2.app));
	$header.dblclick(this.showRenameControl.bind(this));
	$header.mouseenter(E2.app.onNodeHeaderEntered.bind(E2.app, parent_node));
	$header.mouseleave(E2.app.onNodeHeaderExited.bind(E2.app));

	if (parent_node.plugin.desc) {
		$header.attr('alt', '' + parent_node.uid);
		this.setupTooltips($header);
	}

	this.getPluginUIFlags(true);
	this.setCssClass();
	this.redrawSlots();

	this.parent_node.on('openStateChanged', function(isOpen) {
		that.setCssClass();
		that.parent_node.update_connections()
		E2.app.updateCanvas(true)
	})
	// @todo this fails?
	this.parent_node.parent_graph.addListener('nodeRenamed', this.onRenamed.bind(this));

	make_draggable($dom,
		E2.app.onNodeDragged.bind(E2.app, parent_node),
		E2.app.onNodeDragStopped.bind(E2.app, parent_node))

	this.update();	// place in position;
//	this.parent_node.addListener('slotAdded', this.redrawSlots.bind(this));
//	this.parent_node.addListener('slotRemoved', this.redrawSlots.bind(this));

}

NodeUI.prototype = Object.create(EventEmitter.prototype);

NodeUI.prototype.updateTooltipsPosition = function(data) {	// find any tooltips that have our nodeId and move them accordingly.
	var repositionMyTooltips = function(data) {
		// data has uiid, dx,dy,and dz;
		var uiid = data.uiid;
		var $tooltips = jQuery('div.popover')
							.filter(function(){
									return $(this).data('uiid') == data.uiid;
								});
		if ($tooltips.length < 1) return true;
		$tooltips.each(function(){
			var $tip = jQuery(this);
			var t_uiid = $tip.data('uiid');		// the tip contains the id of UI that "owns" it
			if (!t_uiid) return;
			if (t_uiid !== uiid) return;		// check if this is us by comparing with uuid from arguments
			var pos = $tip.position();
			$tip.css({
				top: ''+ (pos.top + data.dy) + 'px',
				left: ''+ (pos.left + data.dx) + 'px'
			});
		});
	}
	repositionMyTooltips(data);
	return true;
};

NodeUI.prototype.destroy = function() {
	this._destroying = true;
	this.removeAllListeners();

	jQuery('div.popover').remove();	// clean up any tooltips, globally
	this.onHideTooltip(null);

	// clean up our own dom and remove it
	[this.input_col,
		this.output_col,
		this.inline_in,
		this.inline_out,
		this.header,
		this.content,
		this.plugin_container,
		this.plugin_ui
	].forEach(
		function(j){
			if (typeof j === 'function') {
				j.remove();
			}
			j={};
		});
	this.dom.remove();
	this._destroyed = true;
	return this;
}

NodeUI.prototype.onRenamed = function(graph, node) {
	if (node === this.parent_node) {
		this.setCssClass();
	}
	return true;
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
	classIf(this.isRenamed(), 'p_renamed');

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
	can = can && !p.has_subgraph;

	var exceptPlugins = ['envelope_modulator'];

	var myCategory = this.getNodeCategory();
	can = can && (uiNodeCategoriesThatNormallyDisplayOutputInHeader.indexOf(myCategory) > -1);
	can = can && (exceptPlugins.indexOf(this.parent_node.plugin.id) === -1);

	return can;
};

NodeUI.prototype.canDisplayInline = function() {
	var p = this.getPluginUIFlags();	// variables used to make a decision.
	var category = this.getNodeCategory();
	var is_io = (category === uiNodeCategory.io);
	var can = !p.has_plugin_ui;
	can = can && !p.has_subgraph;
	can = can && is_io;
	if (is_io) {
		can = can && ((p.single_in && !p.has_outputs) ||
				(p.single_out && !p.has_inputs) ||
				((this.parent_node.dyn_inputs.length === 1) && (!p.has_outputs)) ||		// read var
				((this.parent_node.dyn_outputs.length === 1) && (!p.has_inputs)));		// write var
	} else {
		can = can && ((p.single_in && !p.has_outputs) || (p.single_out && !p.has_inputs));
	}

	return can;
};

NodeUI.prototype.getContainerForSlotsOfType = function(is_inp, is_dyn) {
	var can_inline = this.canDisplayInline();
	var out_h = this.canDisplayOutputInHeader();
	var in_h = this.canDisplayInputInHeader();
	if (can_inline) return (is_inp) ? this.inline_in : this.inline_out;
	// else
	if (is_dyn) return (is_inp) ? this.input_col : this.output_col;
	// else static
	if (out_h && !is_inp) return this.inline_out;
	if (in_h && is_inp) return this.inline_in;
	return null;
}

NodeUI.prototype.redrawSlots = function() {
	var can_display_inline = this.canDisplayInline();

	this.inline_in.empty();
	this.inline_out.empty();
	this.input_col.empty();
	this.output_col.empty();

	if (can_display_inline) {
		this.render_slots(this.inline_in, this.parent_node.plugin.input_slots, E2.slot_type.input);
		this.render_slots(this.inline_out, this.parent_node.plugin.output_slots, E2.slot_type.output);
		this.render_slots(this.inline_in, this.parent_node.dyn_inputs, E2.slot_type.input);
		this.render_slots(this.inline_out, this.parent_node.dyn_outputs, E2.slot_type.output);
		return this;
	}
	// else...

	// render inputs
	this.render_slots(this.input_col, this.parent_node.plugin.input_slots, E2.slot_type.input);
	if(this.parent_node.dyn_inputs)
		this.render_slots(this.input_col, this.parent_node.dyn_inputs, E2.slot_type.input);

	// render outputs

	if (this.canDisplayOutputInHeader()) {
		this.render_slots(this.inline_out, this.parent_node.plugin.output_slots, E2.slot_type.output);
		// just in case
		if(this.parent_node.dyn_outputs)
			this.render_slots(this.output_col, this.parent_node.dyn_outputs, E2.slot_type.output);
	} else {
		this.render_slots(this.output_col, this.parent_node.plugin.output_slots, E2.slot_type.output);
		if(this.parent_node.dyn_outputs)
			this.render_slots(this.output_col, this.parent_node.dyn_outputs, E2.slot_type.output);
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

NodeUI.prototype.hasBeenRenamed = function() {
	var has_title = (this.parent_node.title || false);
	var has_no_subgraph = !this.hasSubgraph();
	var node_category = this.getNodeCategory();
	var not_exempt = [uiNodeCategory.value].indexOf(node_category) === -1;	// renaming some nodes is mandatory
	return (has_title && not_exempt && has_no_subgraph && (this.parent_node.title !== this.parent_node.id));
};

NodeUI.prototype.isRenamed = NodeUI.prototype.hasBeenRenamed;

NodeUI.prototype.setPosition = function(x, y, z) {
	var data = {
		uiid: this._id,
		nid: this.nid,
		dx: this.position.x,
		dy: this.position.y,
		dz: this.position.z
	};
	if (typeof x !== 'undefined') this.position.x = this.x = x;
	if (typeof y !== 'undefined') this.position.y = this.y = y;
	if (typeof z !== 'undefined') this.position.z = this.z = z;

	this.update();	// this may adjust position

	data.dx = this.position.x - data.dx;
	data.dy = this.position.y - data.dy;
	data.dz = this.position.z - data.dz;
	this.updateTooltipsPosition(data);

	this.emit(uiNodeEventType.positionChanged, data);	// @todo this doesn't always emit?
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
	if (xx < 0) this.position.x = this.x = xx = 0;
	if (yy < 0) this.position.y = this.y = yy = 0;
	s.left = '' + xx + 'px';
	s.top = '' + yy + 'px';
};


NodeUI.prototype.showRenameControl = function() {
	var that = this
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
					that.setCssClass();	// @todo remove call once nodeRenamed handler works
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


NodeUI.prototype.onShowTooltip = function(e) {
	var that = this		// NodeUI

	if(E2.app.inDrag)
		return false;

	var $elem = $(e.currentTarget);

	if (!this._ttdata) this._ttdata = {
		_tooltipElem : null,
		_tooltipTimer : null,
		_tooltipHideTimer : null
	};
	var data = this._ttdata;

	var tokens = $elem.attr('alt').split('_');

	var core = E2.core;
	var node = E2.core.active_graph.nuid_lut[tokens[0]];
	var txt = '';
	var readmore= '';

	if(tokens.length < 2) // Node?
	{
		var p_name = core.pluginManager.keybyid[node.plugin.id];

		txt += '<b>' + p_name + '</b><br/><br/>' + node.plugin.desc;
	}
	else // Slot
	{
		var plugin = node.plugin;
		var slot = null;

		if(tokens[1][0] === 'd')
			slot = node.findSlotByUid(tokens[2])
		else
			slot = (tokens[1][1] === 'i' ? plugin.input_slots : plugin.output_slots)[parseInt(tokens[2], 10)];

		txt = '<b>Type:</b> ' + slot.dt.name;

		if (slot.array)
			txt += '<br><b>Array:</b> yes';

		if (slot.inactive)
			txt += '<br><b>Inactive:</b> yes';

		if(slot.lo !== undefined || slot.hi !== undefined)
			txt += '<br><b>Range:</b> ' + (slot.lo !== undefined ? 'min. ' + slot.lo : '') + (slot.hi !== undefined ? (slot.lo !== undefined ? ', ' : '') + 'max. ' + slot.hi : '')

		if (slot.def !== undefined) {
			txt += '<br><b>Default:</b> '

			if (slot.def === null)
				txt += 'Nothing'
			else
				txt += slot.def
		}

		txt += '<br /><br />';

		if (readmore) {
			readmore = '<div class="readmore">' + readmore + '</div>'
		}

		if(slot.desc)
			txt += slot.desc.replace(/\n/g, '<br/>');
	}


	var popovers = jQuery('body div.popover');
	var timeout = (popovers.length > 0) ? 100 : 750;

	if (data._tooltipTimer) clearTimeout(data._tooltipTimer);
	if (data._tooltipElem) {
		data._tooltipElem.popover('destroy');
		data._tooltipElem = null;
		clearTimeout(data._tooltipHideTimer);
	}

	var uiid = this._id;
	data._tooltipTimer = setTimeout(function() {
		if (E2.app.inDrag)
			return;

		$elem.popover('destroy');
		popovers.remove();

		$elem.popover({
			title: txt,
			content: readmore,
			container: 'body',
			animation: false,
			trigger: 'manual',
			placement: 'top',
			html: true,
			template: '<div class="popover" role="tooltip" data-uiid="'+uiid+'"><div class="arrow"></div><div class="popover-title"></div><div class="popover-content"></div></div>'
		})
		.popover('show');

		data._tooltipElem = $elem;
		data._tooltipHideTimer = setTimeout(that.onHideTooltip.bind(that), 20000);

	}, timeout);

	return true;

};

NodeUI.prototype.onHideTooltip = function(e) {	// this = $(element that has popovers)
	var data = this._ttdata;
	if (!data) return true;

	clearTimeout(data._tooltipTimer)
	clearTimeout(data._tooltipHideTimer)
	var kill_tooltip = function() {
		if (data._tooltipElem) {
			data._tooltipElem.popover('destroy');
			data._tooltipElem = null;
		}
	};
	if (this._destroying)
		kill_tooltip()
	else
		setTimeout(kill_tooltip, 35);	// note this timeout must be less than the least in onShowToolTip

	return (E2.app.inDrag)
};

/**** "static" *****/

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
NodeUI.makeSpriteSVGButton = function($svg, alt_text, $have_button) {
	if (typeof $have_button === 'undefined') $have_button = makeButton(null, '');
	return $have_button
		.attr('title', (alt_text || ''))
		.removeClass('btn')
		.addClass('vp svg')
		.append($svg);
};


// sets up tooltip event listeners for a dom element that represents a node or slot
NodeUI.prototype.setupTooltips = function($element) {
	var uiId = $element.data('uiid');
	if ((typeof uiId === 'undefined') || (!uiId)) {
		$element.attr('data-uiid', this._id).data('uiid', this._id);
	}
	$element.hover(this.onShowTooltip.bind(this), this.onHideTooltip.bind(this));
	return $element;
};

NodeUI.prototype.create_slot = function(container, s, type) {
	var $div = make('div');

	var parent_node = this.parent_node;
	var nid = this.nid;

	var is_input = (type === E2.slot_type.input);
	var is_dynamic = (typeof s.uid != 'undefined')
	var is_connected = (typeof s.is_connected != 'undefined') && s.is_connected;

	var sid;
	if (is_dynamic)
		sid = nid + (is_input ? 'di' : 'do') + s.uid;
	else
		sid = nid + (is_input ? 'si' : 'so') + s.index;
	$div.attr('id',sid);

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

	container.append($div);
	$div.mouseenter(E2.app.onSlotEntered.bind(E2.app, parent_node, s, $div));
	$div.mouseleave(E2.app.onSlotExited.bind(E2.app, parent_node, s, $div));
	$div.mousedown(E2.app.onSlotClicked.bind(E2.app, parent_node, s, $div, type));

	var altSid = '' + parent_node.uid;

	altSid += '_' + (s.uid !== undefined ? 'd' : 's');
	altSid += type === E2.slot_type.input ? 'i' : 'o';
	altSid += '_' + (s.uid !== undefined ? s.uid : s.index);

	$div.attr('alt', altSid);

	// some more metadata
	var is_dyn = is_dynamic.toString();
	$div.data('nid', this.nid).attr('data-nid', this.nid);
	$div.data('dyn', is_dyn).attr('data-dyn', is_dyn);
	$div.data('type', type).attr('data-type', type);
	this.setupTooltips($div);

	return $div;
};


NodeUI.prototype.render_slots = function(container, slots, type) {
	for(var i = 0, len = slots.length; i < len; i++)
		this.create_slot(container, slots[i], type);
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

