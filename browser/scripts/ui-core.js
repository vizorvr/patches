var uiKeys = {
	enter: 13,
	shift : 16,
	ctrl: 17,						// 	ctrl
	left_window_key : 91,			// 	cmd, = ctrl for us
	meta : 224,						// 	firefox
	alt: 18,
	spacebar: 32,

	openInspector	: 73,			//	i
	toggleUILayer	: 9,			// 	(shift+) tab,
	togglePatchEditor : 9,			// 	tab
	toggleFullScreen : 70,			// 	f,
	toggleFloatingPanels : 66,		// 	(ctrl+) b
	focusPresetSearch: 191,			//	/
	focusPresetSearchAlt: 81,		//  q
	viewSource:		220,			//	\

	focusChatPanel: 'U+0040',		// @ - this key moves so is checked by value/identifier
	focusChatPanelAlt: '@',			//

	mod_shift : 1000,
	mod_ctrl : 10000,
	mod_alt : 100000
};

var uiViewMode = {
	patch_editor : 'patches',
	world_editor : 'editor'
};

VizorUI = function VizorUI() {	// E2.ui
	var that = this;
	this.dom = {				// init sets this to E2.dom
		chatWindow : null,
		presetsLib : null,
		assetsLib : null
	};

	this._initialised = false;
	this.visible = true;		// overall visibility of the UI
	this.visibility = {			// granular flags
		floating_panels: true,
		panel_chat: true,
		panel_assets: false,
		panel_presets: true,
		patch_editor: true,
		breadcrumb: true,		// always true	(20151012)
		player_controls : true,	// always true	(20151012)
		main_toolbar : true,	// always true	(20151012)
		inspector	: false		// always false (20151012)
	};
	this.viewmode = uiViewMode.patch_editor; // one of uiViewMode keys
	this.flags = {
		loading: false,
		fullscreen: false,
		key_shift_pressed: false,
		key_alt_pressed : false,
		key_ctrl_pressed : false		// ctrl or cmd on osx, ctrl on windows
	};
	this.always_track_keys = [			// always update ui.flags with the status of these keys
		uiKeys.alt, uiKeys.shift, uiKeys.ctrl, uiKeys.left_window_key, uiKeys.meta
	];
};

VizorUI.prototype._init = function(e2) {	// called by .init() in ui.js
	this.dom = e2.dom;
	document.body.addEventListener('keydown', this.onKeyDown.bind(this));
	document.body.addEventListener('keyup', this.onKeyUp.bind(this));
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));
};

VizorUI.prototype.getZoom = function() {
	return 1;
}

/**
 * get the state of a UI (tabbed) panel. if no $domElement provided, then _found = false
 * @param $domElement
 * @returns {{_found: boolean, visible: boolean, collapsed: boolean, selectedTab: null, x: boolean, y: boolean}}
 */
VizorUI.prototype.getDomPanelState = function($domElement) {	/* @var $domElement jQuery */
	var state = {
		_found: false,
		visible : true,
		collapsed : false,
		selectedTab : null,
		x: false,
		y: false,
		w: -1,
		h: -1
	};
	if ((typeof $domElement === 'object') && ($domElement.length > 0)) {
		state._found = true;
		state.visible = $domElement.is(':visible') && $domElement.hasClass('uiopen');
		state.collapsed = $domElement.hasClass('collapsed');
		var pos = $domElement.position();
		if (pos) {
			state.x = pos.left;
			state.y = pos.top;
		}
		state.w = $domElement.width();
		state.h = $domElement.height();
		// get the active tab
		var $activeLi = $domElement.find('li.active');
		if ($activeLi.length>0) {
			var tabName, tabLink;
			tabName = $activeLi.data('tabname');			// data-tabname='presets' preferred
			if (tabName) {
				state.selectedTab = tabName;
			} else {
				tabLink = $activeLi.find('a');
				state.selectedTab = tabLink.attr('href');	// #something
			}
		}
		// else this isn't tabbed so selectedTab does not apply
	}
	return state;
}

VizorUI.prototype.getState = function() {
	if (typeof clone !== 'function') return null;	// why are we here?
	if (!this._initialised) return false;
	var s = {};
	s['visible'] = this.visible;
	s['visibility'] = clone(this.visibility);		// util.js
	s['viewmode'] = this.viewmode;
	s['panelStates'] = {
		chat:		null,
		presets:	null,
		assets:		null
	};
	var ps = s['panelStates'];					// ref
	ps.chat = this.getDomPanelState(this.dom.chatWindow);
	ps.presets = this.getDomPanelState(this.dom.presetsLib);
	ps.assets = this.getDomPanelState(this.dom.assetsLib);
	return s;
};


VizorUI.prototype.setState = function(state) {
	if ((!this._initialised) || (typeof state !== 'object')) return false;
	if (typeof clone !== 'function') return null;	// why are we here?
	this.visible = state.visible;
	this.visibility = clone(state.visibility);
	this.updateVisibility();
	this.setWorldEditorMode(state.viewmode === uiViewMode.world_editor);

	var that=this;
	var applyPanelState = function($el, state, collapse_callback) {
		if ((typeof $el !== 'object') || ($el.length === 0)) return false;
		// ignores visibility which is already applied
		var collapsed = state.collapsed || false;
		var selectedTab = state.selectedTab || false;
		var x = state.x || 0;
		var y = state.y || 0;
		var w = state.w || 0;	// w currently ignored
		var h = state.h || 0;	// h only applied to chat window
		// collapse if needed
		if (typeof collapse_callback === 'function') {	// collapse callback will collapse the window or not
			if (collapsed) {
				$el.removeClass('collapsed');
			} else {
				$el.addClass('collapsed');
			}
			collapse_callback.apply(that);
		} else {										// we collapse or expand the window
			if (collapsed) {
				$el.addClass('collapsed');
			} else {
				$el.removeClass('collapsed');
			}
		}
		if (!((x===0) && (y === 0))) {
			var parent = $el.parent();
			var parentHeight = parent.innerHeight();
			var parentWidth = parent.innerWidth();
			if ((parentWidth>0) && (parentHeight>0)) {	// constrain these
				var oh = $el.outerHeight;
				var ow = $el.outerWidth();
				if (oh < 50) oh = 100;
				if (ow < 50) ow = 100;
				if (y > parentHeight) {
					y = parentHeight - oh;
				}
				if (x > parentWidth) {
					x = parentWidth - ow;
				}
			}
			$el.css({
				'left' : '' + x + 'px',
				'top' : '' + y + 'px'
			});
		}
		//
		if (selectedTab) {
			if (selectedTab.indexOf('#') === 0) {	// this is a href, so find link to click
				var $a = $el.find("a[href='"+selectedTab+"']");
				$a.parent().removeClass('active')
				$a.trigger('click');
			} else {
				$el.find("li[data-tabname='"+selectedTab+"'").find('a').trigger('click');
			}
		}
		return true;
	};

	if (typeof state.panelStates !== 'undefined') {
		var ps = state.panelStates;
		if (typeof ps.chat !== 'undefined') {
			var $chatPanel = this.dom.chatWindow;
			applyPanelState($chatPanel, ps.chat, this.onChatToggleClicked);
			var activeTabIsChat = (ps.chat.selectedTab === '#chatTab') || (ps.chat.selectedTab === 'chat');
			if (activeTabIsChat && (ps.chat.h > 0)) {	// only apply height if the state had chat selected
				this.dom.chatWindow.height(ps.chat.h);
				this.onChatResize();
			}
		}
		if (typeof ps.presets !== 'undefined') {
			applyPanelState(this.dom.presetsLib, ps.presets, this.onPresetsToggleClicked);
		}
		if (typeof ps.assets !== 'undefined') {
			applyPanelState(this.dom.assetsLib, ps.assets, this.onAssetsToggleClicked);
		}
	}

	this.enforceStateConstraints();
	return true;
};

VizorUI.prototype.getStateJSON = function() {
	var state = this.getState();
	return (typeof state === 'object') ? JSON.stringify(state, null, '  ') : state;
}

VizorUI.prototype.setStateJSON = function(stateJSON) {
	var state = JSON.parse(stateJSON);
	return (typeof state === 'object') ? this.setState(state) : false;
}

VizorUI.prototype.enforceStateConstraints = function() {

	var referenceTop	= jQuery('#canvases').offset().top;
	var referenceBottom	= 45;	// #652
	var referenceLeft	= 0;
	var that = this;

	var constrainPanel = function($panel, constrainHeight, callback) {
		if (!$panel.is(':visible')) return false;
		constrainHeight = !!(constrainHeight || false);
		var panelHeight = $panel.outerHeight(true);
		var panelWidth = $panel.outerWidth(true);
		var parentHeight = $panel.parent().innerHeight();
		var parentWidth = $panel.parent().innerWidth();
		var availableHeight = parentHeight - referenceBottom;	// #652
		var availableWidth = parentWidth;
		console.log('css height is: ' + $panel.css('height'));
		var isAutoHeight = ($panel.css('height') === 'auto');

		var pos = $panel.position();
		if (pos.left === 0) pos = $panel.offset();

		var panelTop = pos.top;
		var panelLeft = pos.left;
		var newX = panelLeft, newY = panelTop, newH = panelHeight;

		if (panelHeight > parentHeight) {
			$panel.height(parentHeight - 10);
		}
		if (panelTop + panelHeight > availableHeight) {	// uh oh

			if (newH > availableHeight) {
				newH = availableHeight;
			}
			if (newH <= availableHeight) {	// change the top only
				newY -= ((newY + newH) - availableHeight);
			}
			if (newY < referenceTop) {
				newH = newH - (referenceTop - newY) - 10;
				newY = referenceTop + 5;
			}

		}
		if (panelLeft + panelWidth > parentWidth) {
			newX -= ((newX + panelWidth) - availableWidth);
		}
		if (newX < referenceLeft) newX = referenceLeft + 5;


		if (constrainHeight) $panel.height(newH);
		$panel.css({top: newY, left: newX});

		if (typeof callback === 'function') setTimeout(callback.bind(that), 200);
		return true;
	}

	if (this.isVisible()) {
		if (this.visibility.panel_chat) constrainPanel(this.dom.chatWindow, true, this.onChatResize);
		if (this.visibility.panel_assets) constrainPanel(this.dom.assetsLib);
		if (this.visibility.panel_presets) constrainPanel(this.dom.presetsLib);
	}




}

/***** IS... *****/

VizorUI.prototype.isFullScreen = function() {
	return !!(document.mozFullScreenElement || document.webkitFullscreenElement)
}
VizorUI.prototype.isVisible = function() {
	return this.visible;
}
VizorUI.prototype.isLoading = function() {
	return this.flags.loading;
}
VizorUI.prototype.isVRCameraActive = function() {
	return E2.app.worldEditor.isActive();	// app.isVRCameraActive ORs between this and noodles visible
}
VizorUI.prototype.isModalOpen = function() {
	// was: return ($("body").data('bs.modal') || {}).isShown;
	var $modal = jQuery('div.bootbox.modal');
	this.visibility.modal = $modal.hasClass('in');
	return this.visibility.modal;
}


/**** EVENT HANDLERS ****/
VizorUI.prototype._trackModifierKeys = function(keyCode, isDown) {	// returns bool if any modifiers changed
	if ((typeof keyCode === 'undefined') || this.always_track_keys.indexOf(keyCode) === -1) return false;
	var newvalue = !!(isDown || false);
	switch (keyCode) {
		case uiKeys.ctrl:	// fall-through
		case uiKeys.left_window_key:
		case uiKeys.meta:
			this.flags.key_ctrl_pressed = newvalue;
			break;
		case uiKeys.alt:
			this.flags.key_alt_pressed = newvalue;
			break;
		case uiKeys.shift:
			this.flags.key_shift_pressed = newvalue;
			break;
	}
	return true;
};
VizorUI.prototype.getModifiedKeyCode = function(keyCode) {	// adds modifier keys value to keyCode if necessary
	if (typeof keyCode != 'number') return keyCode;
	if (this.flags.key_shift_pressed) keyCode += uiKeys.mod_shift;
	if (this.flags.key_alt_pressed) keyCode += uiKeys.mod_alt;
	if (this.flags.key_ctrl_pressed) keyCode += uiKeys.mod_ctrl;
	return keyCode;
};
VizorUI.prototype.onKeyDown = function(e) {

	this._trackModifierKeys(e.keyCode, true);
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e)) return true;
	var keyCode = this.getModifiedKeyCode(e.keyCode);

	switch (keyCode) {
		case (uiKeys.viewSource):
			this.viewSource();
			e.preventDefault();
			break;
		case (uiKeys.openInspector):
			this.onInspectorClicked();
			e.preventDefault();
			break;
		case (uiKeys.toggleFloatingPanels + uiKeys.mod_ctrl):
			if (!this.visible) {
				// nothing is visible and we just want the panels so reset the UI
				this.visibility.patch_editor = false;
				this.visible = true;
				this.toggleFloatingPanels(true);
			} else
				this.toggleFloatingPanels();
			e.preventDefault();
			break;
		case (uiKeys.togglePatchEditor):
			if (!this.visible) {
				// nothing is visible and we just want the noodles so reset the UI
				this.visible=true;
				this.visibility.floating_panels = false;
				this.togglePatchEditor(true);
			} else
				this.togglePatchEditor();
			e.preventDefault();
			break;
		case (uiKeys.toggleUILayer + uiKeys.mod_shift):
			if (this.visible) {
				if (!(this.visibility.floating_panels || this.visibility.patch_editor)) {	// UI is visible but parts aren't so show them
					this.visibility.patch_editor = this.visibility.floating_panels = true;
					this.visible = false;	// pretend we were invisible
				}
			}
			this.visible = !this.visible;
			this.updateVisibility();
			e.preventDefault();
			break;
		case (uiKeys.focusPresetSearchAlt):
		case (uiKeys.focusPresetSearch):
			if (this.visible) {
				if (!this.visibility.floating_panels) {
					// reset the floating panels
					this.visibility.floating_panels = true;
					this.visibility.panel_chat = this.visibility.panel_assets = false;
				}
			}
			this.visibility.panel_presets = true;
			this.updateVisibility();
			setTimeout(function(){
				jQuery('#presets-lib div.block-header ul.nav-tabs li').first().find('a').trigger('click');
				jQuery('#presetSearch').focus().select();
			}, 100);

			e.preventDefault();
			e.stopPropagation();
			break;
	}

	var keyIdentifier = (typeof e.keyIdentifier !== 'undefined') ? e.keyIdentifier : (e.key || '');
	switch (keyIdentifier) {
		case uiKeys.focusChatPanel:		// fallthrough
		case uiKeys.focusChatPanelAlt:
			var v = this.visibility;
			if (!this.visible) {		// there's nothing on the screen and we just want the chat
				this.visible = true
				v.patch_editor = false;
				v.floating_panels = true;
				v.panel_assets = false;
				v.panel_presets = false;
			}
			else if (!v.floating_panels) {
				v.floating_panels = true;
				v.panel_assets = false;
				v.panel_presets = false;
			}
			v.panel_chat = true;
			this.updateVisibility();
			this.dom.chatWindow.find('#new-message-input').focus();
			e.preventDefault();
			e.stopPropagation();
			break;
	}

	if (this.isVRCameraActive()) {
		return true;
	}

	// non-vr-events only here

	return true;
};
VizorUI.prototype.onKeyUp = function(e) {	// bound for future use
	this._trackModifierKeys(e.keyCode, false);
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e)) return true;
	var keyCode = this.getModifiedKeyCode(e.keyCode);

	if (this.isVRCameraActive()) {
		return true;
	}

	return true;
};

VizorUI.prototype.onFullScreenChanged = function() {	// placeholder
	this.flags.fullscreen = this.isFullScreen();
	return true;
};

VizorUI.prototype.onWindowResize = function() {	// placeholder
	this.enforceStateConstraints();
	return true;
};


// reads the visibility state of various parts of the UI
VizorUI.prototype.syncVisibility = function() {
	var $assets = E2.dom.assetsLib, $presets = E2.dom.presetsLib, $chat = E2.dom.chatWindow;
	this.visibility.panel_assets = $assets.hasClass('uiopen');
	this.visibility.panel_presets = $presets.hasClass('uiopen');
	this.visibility.panel_chat = $chat.hasClass('uiopen');
	this.visibility.patch_editor = E2.app.noodlesVisible;
//	this.visibility.floating_panels = (this.visibility.panel_assets || this.visibility.panel_presets || this.visibility.panel_chat);
};

// applies visibility state to parts of UI as dictated by this.visible and this.visibility
VizorUI.prototype.updateVisibility = function() {
	var $assets = E2.dom.assetsLib, $presets = E2.dom.presetsLib, $chat = E2.dom.chatWindow, $patch_editor = E2.dom.canvas_parent;
	var show_panels = this.visible && this.visibility.floating_panels;
	$assets.toggle(show_panels && this.visibility.panel_assets);
	$presets.toggle(show_panels && this.visibility.panel_presets);
	$chat.toggle(show_panels && this.visibility.panel_chat);
	$patch_editor.toggle(this.visible && this.visibility.patch_editor);
	E2.app.noodlesVisible = this.visibility.patch_editor;
	this.enforceStateConstraints();
};



/***** TOGGLE LAYERS OF THE UI ON OR OFF *****/
VizorUI.prototype.toggleFloatingPanels = function(forceVisibility) {
	if (typeof forceVisibility != 'undefined')
		this.visibility.floating_panels = forceVisibility;
	else
		this.visibility.floating_panels = !this.visibility.floating_panels;

	this.updateVisibility();
};

VizorUI.prototype.togglePatchEditor = function(forceVisibility) {
	if (typeof forceVisibility != 'undefined')
		this.visibility.patch_editor = forceVisibility;
	else
		this.visibility.patch_editor = !this.visibility.patch_editor;
	this.updateVisibility();

	if (this.visibility.patch_editor)
		NodeUI.redrawActiveGraph();

}
VizorUI.prototype.toggleNoodles = VizorUI.prototype.togglePatchEditor; // @deprecated
