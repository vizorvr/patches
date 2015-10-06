var uiKeys = {
	enter: 13,
	shift : 16,
	ctrl: 17,						// 	ctrl
	left_window_key : 91,			// 	cmd, = ctrl for us
	meta : 224,						// 	firefox
	alt: 18,
	spacebar: 32,

	openInspector	: 73,			//	i
	toggleUILayer 	: 9,			// 	(shift+) tab,
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
	this.dom = {};				// init sets this to E2.dom

	this.visible = true;		// overall visibility of the UI
	this.visibility = {			// granular flags
		floating_panels: true,
		panel_chat: true,
		panel_assets: false,
		panel_presets: true,
		patch_editor: true,
		breadcrumb: true,
		player_controls : true,
		main_toolbar : true
	};
	this.viewmode = uiViewMode.patch_editor; // one of uiViewMode keys
	this.uploading = false;
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
VizorUI.prototype.isUploading = function() {
	return this.uploading;
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
	var newHeight = E2.dom.canvas_parent.height();
	E2.dom.dragOverlay.height(newHeight);
	
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
