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

var uiViewCam = {
	vr				: 'hmd',
	world_editor	: 'editor'
};

var uiEvent = { // emitted by ui (E2.ui) unless comments state otherwise
	initialised		: 'uiInitialised',
	moved			: 'uiMoved',			// panels via movable.js
	stateChanged	: 'uiStateChanged',
	worldEditChanged : 'uiWorldEditorChanged',	// ui and E2.app
	xhrFormSuccess	: 'xhrFormSuccess'		//	dispatched on document in ui-site js
}

var VizorUI = function() {			// becomes E2.ui
	EventEmitter.apply(this, arguments)

	this._initialised = false;

	this.dom = {				// init sets this to E2.dom
		chatWindow : null,
		presetsLib : null,
		assetsLib : null
	};

	this.state = {
		visible:	true,		// overall visibility of the UI
		visibility: {			// granular flags
			floating_panels: true,
			panel_chat: true,
			panel_assets: false,
			panel_presets: true,
			patch_editor: false,
			breadcrumb: true,		// always true	(20151012)
			player_controls : true,	// always true	(20151012)
			main_toolbar : true,	// always true	(20151012)
			inspector	: false,	// always false (20151012)
			timeline	: false		// (20151019)
		},
		panelStates: {
			chat:		null,
			presets:	null,
			assets:		null
		},
		context: {
			width		: window.screen.width,
			height		: window.screen.height,
			availWidth	: window.screen.availWidth,
			availHeight	: window.screen.availHeight
		},
		viewCamera : uiViewCam.world_editor		// one of uiViewCam keys
	};
	this.setupStateMethods();	// adds code to update the current or apply new state

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
VizorUI.prototype = Object.create(EventEmitter.prototype);

VizorUI.prototype._init = function(e2) {	// called by .init() in ui.js
	this.dom = e2.dom;
	document.body.addEventListener('keydown', this.onKeyDown.bind(this));
	document.body.addEventListener('keyup', this.onKeyUp.bind(this));
	window.addEventListener('blur', this._clearModifierKeys.bind(this));
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));

	this.on(uiEvent.initialised, this.recallState.bind(this));
	this.on(uiEvent.stateChanged, this.storeState.bind(this));
}

VizorUI.prototype.updateState = function() {
	this.state._update({
		'chat':		this.dom.chatWindow,
		'presets':	this.dom.presetsLib,
		'assets':	this.dom.assetsLib
	});
	this.emit(uiEvent.stateChanged, this.state._getCopy());
	return true;
}

VizorUI.prototype.setupStateMethods = function() {
	var ui = this;

	this.state._update = function(domPanelStates) {	/* @var domPanelStates {key: $domElement, ...} */
		if (!ui._initialised) return msg('ERROR: UI not initialised');
		// this = ui.state
		this.context.availWidth = window.screen.availWidth;
		this.context.availHeight = window.screen.availHeight;
		var ps = this.panelStates;					// ref
		if (typeof domPanelStates === 'object') {
			var key;
			for (key in domPanelStates) {
				if (domPanelStates.hasOwnProperty(key)) {
					ps[key] = VizorUI.getDomPanelState(domPanelStates[key]);
				}
			}
		}
		return this;
	};

	this.state._apply = function(newState) {
		if (!ui._initialised) return msg('ERROR: UI not initialised');
		if (typeof newState !== 'object') return msg('ERROR: invalid newState')
		// this = ui.state
		this.visible = newState.visible;
		var newVisibility = newState.visibility;
		if (typeof newState.viewCamera !== 'undefined') this.viewCamera = newState.viewCamera;

		// take values from supplied visibility, but default to current
		var k;
		for (k in this.visibility) {
			if (typeof newVisibility[k] !== 'undefined') this.visibility[k] = newVisibility[k];
		}
		k=null;

		ui.applyVisibility(false);

		if (typeof newState.panelStates === 'undefined') return true;	// nothing else left to do

		var ps = newState.panelStates;
		if (typeof ps.chat !== 'undefined') {
			var $chatPanel = ui.dom.chatWindow;
			var chatState = ps.chat;
			VizorUI.applyPanelState($chatPanel, chatState, ui.onChatToggleClicked.bind(ui));
			var activeTabIsChat = (chatState.selectedTab === '#chatTab') || (chatState.selectedTab === 'chat');
			if (activeTabIsChat && (chatState.h > 0)) {	// only apply height if the state had chat selected
				ui.dom.chatWindow.height(chatState.h);
				ui.onChatResize();
			}
		}
		if (typeof ps.presets !== 'undefined') {
			VizorUI.applyPanelState(ui.dom.presetsLib, ps.presets, ui.onPresetsToggleClicked.bind(ui));
		}
		if (typeof ps.assets !== 'undefined') {
			VizorUI.applyPanelState(ui.dom.assetsLib, ps.assets, ui.onAssetsToggleClicked.bind(ui));
		}

		ui.setWorldEditorMode(this.viewCamera === uiViewCam.world_editor);

		return true;
	};

	this.state._getCopy = function() {
		return {
			visible: this.visible,
			viewCamera: this.viewCamera,
			visibility: clone(this.visibility),
			panelStates: clone(this.panelStates),
			context: clone(this.context)
		};
	}

};

VizorUI.prototype.getState = function() {
	if (!this._initialised) return msg('ERROR: UI not initialised');
	return this.state._getCopy();
}

VizorUI.prototype.setState = function(stateObjOrJSON) {
	if (!this._initialised) return msg('ERROR: UI not initialised')
	var newState;
	try {
		newState = (typeof stateObjOrJSON === 'object') ? stateObjOrJSON : JSON.parse(stateObjOrJSON);
	}
	catch (e) {
		console.error(e);
		return msg('ERROR: failed parsing state json');
	}
	this.state._apply(newState);
	this.enforceConstraints();
	return true;
}

VizorUI.prototype.enforceConstraints = function() {
	if (!this.isVisible()) return;

	var visibility = this.state.visibility;

	var referenceTop	= jQuery('#canvases').offset().top;
	var referenceBottom	= 45;	// #652
	var referenceLeft	= 0;

	if (visibility.panel_chat) {
		VizorUI.constrainPanel(this.dom.chatWindow, referenceTop, referenceBottom, referenceLeft, true);
		setTimeout(this.onChatResize.bind(this), 200);
	}
	if (visibility.panel_assets) VizorUI.constrainPanel(this.dom.assetsLib, referenceTop, referenceBottom, referenceLeft);
	if (visibility.panel_presets) VizorUI.constrainPanel(this.dom.presetsLib,  referenceTop, referenceBottom, referenceLeft);
}

/***** IS... *****/

VizorUI.prototype.isFullScreen = function() {
	return !!(document.mozFullScreenElement || document.webkitFullscreenElement)
}
VizorUI.prototype.isVisible = function() {
	return this.state.visible;
}
VizorUI.prototype.isPatchVisible = function() {
	return this.state.visibility.patch_editor;
}
VizorUI.prototype.isInProgramMode = VizorUI.prototype.isPatchVisible;
VizorUI.prototype.isInBuildMode = function() {
	return !this.isInProgramMode();
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
	this.state.visibility.modal = $modal.hasClass('in');
	return this.state.visibility.modal;
}


/**** EVENT HANDLERS ****/

VizorUI.prototype._clearModifierKeys = function() {	// blur
	this.flags.key_ctrl_pressed = false;
	this.flags.key_alt_pressed = false;
	this.flags.key_shift_pressed = false;
	return true;
}

VizorUI.prototype._trackModifierKeys = function(keyCode, isDown) {	// returns bool if any modifiers changed
	if ((typeof keyCode === 'undefined') || this.always_track_keys.indexOf(keyCode) === -1) return false;
	var newvalue = !!(isDown || false);
	switch (keyCode) {
		case uiKeys.ctrl:	// fallthrough
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
	if (typeof keyCode !== 'number') return keyCode;
	if (this.flags.key_shift_pressed) keyCode += uiKeys.mod_shift;
	if (this.flags.key_alt_pressed) keyCode += uiKeys.mod_alt;
	if (this.flags.key_ctrl_pressed) keyCode += uiKeys.mod_ctrl;
	return keyCode;
};
VizorUI.prototype.onKeyDown = function(e) {
	this._trackModifierKeys(e.keyCode, true);
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e)) return true;
	var keyCode = this.getModifiedKeyCode(e.keyCode);

	var state = this.state;
	var that = this;
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
			if (!state.visible) {
				// nothing is visible and we just want the panels so reset the UI
				state.visibility.patch_editor = false;
				state.visible = true;
				this.toggleFloatingPanels(true);
			} else {
				this.toggleFloatingPanels();
			}
			e.preventDefault();
			break;
		case (uiKeys.togglePatchEditor):
			if (!state.visible) {
				// nothing is visible and we just want the noodles so reset the UI
				state.visible=true;
				state.visibility.floating_panels = false;
				this.togglePatchEditor(true);
			} else
				this.togglePatchEditor();
			e.preventDefault();
			break;
		case (uiKeys.toggleUILayer + uiKeys.mod_shift):
			if (state.visible) {
				if (!(state.visibility.floating_panels || state.visibility.patch_editor)) {	// UI is visible but parts aren't so show them
					state.visibility.patch_editor = state.visibility.floating_panels = true;
					state.visible = false;	// pretend we were invisible
				}
			}
			state.visible = !state.visible;
			this.applyVisibility();
			e.preventDefault();
			break;
		case (uiKeys.focusPresetSearchAlt):	// fallthrough
		case (uiKeys.focusPresetSearch):
			if (state.visible) {
				if (!state.visibility.floating_panels) {
					// reset the floating panels
					state.visibility.floating_panels = true;
					state.visibility.panel_chat = state.visibility.panel_assets = false;
				}
			}
			state.visibility.panel_presets = true;
			this.applyVisibility(false);	// do not update the state
			setTimeout(function(){
				if (that.isInProgramMode()) {
					that.dom.tabPresets.find('a').trigger('click');
					jQuery('#presetSearch').focus().select();
				} else {
					that.dom.tabObjects.find('a').trigger('click');
					jQuery('#objectSearch').focus().select();
				}

				that.updateState();
			}, 100);

			e.preventDefault();
			e.stopPropagation();
			break;
	}

	var keyIdentifier = (typeof e.keyIdentifier !== 'undefined') ? e.keyIdentifier : (e.key || '');
	switch (keyIdentifier) {
		case uiKeys.focusChatPanel:		// fallthrough
		case uiKeys.focusChatPanelAlt:
			var v = state.visibility;
			if (!state.visible) {		// there's nothing on the screen and we just want the chat
				state.visible = true
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
			this.applyVisibility();
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
	this.enforceConstraints();
	this.updateState();
	return true;
};


// uiEvent.stateChanged
VizorUI.prototype.storeState = function(uiState) {
	var storage = VizorUI.getPersistentStorageRef();
	if (!storage) return;
	storage.setItem('uiState', JSON.stringify(uiState));
}

// uiEvent.initialised
VizorUI.prototype.recallState = function() {
	var storage = VizorUI.getPersistentStorageRef();
	if (!storage) return;
	var uiState = storage.getItem('uiState');
	if (uiState) {
		var ok = this.setState(uiState);
		if (!ok) storage.removeItem('uiState');		// ui refused so this is useless
	}
}


// reads the visibility state of various parts of the UI
VizorUI.prototype.syncVisibility = function() {
	var $assets = this.dom.assetsLib, $presets = this.dom.presetsLib, $chat = this.dom.chatWindow;
	var v = this.state.visibility;
	v.panel_assets	= $assets.hasClass('uiopen');
	v.panel_presets	= $presets.hasClass('uiopen');
	v.panel_chat	= $chat.hasClass('uiopen');
	v.patch_editor	= E2.app.noodlesVisible;
	this.updateState();
};

// applies visibility state to parts of UI as dictated by this.state.visible and this.state.visibility
VizorUI.prototype.applyVisibility = function(andUpdateState) {
	andUpdateState = (typeof andUpdateState === 'undefined') ? true : !!andUpdateState;
	var dom = this.dom;		// normally E2.dom
	var state = this.state;
	var visibility = state.visibility;
	var $assets = dom.assetsLib, $presets = dom.presetsLib, $chat = dom.chatWindow;
	var $patch_editor = dom.canvas_parent;
	var show_panels = state.visible && visibility.floating_panels;

	$assets.toggle(show_panels && visibility.panel_assets)
		.toggleClass('uiopen', show_panels && visibility.panel_assets);
	$presets.toggle(show_panels && visibility.panel_presets)
		.toggleClass('uiopen', show_panels && visibility.panel_presets);
	$chat.toggle(show_panels && visibility.panel_chat)
		.toggleClass('uiopen', show_panels && visibility.panel_chat);

	dom.btnAssets.toggleClass('ui_off', !visibility.panel_assets);
	dom.btnPresets.toggleClass('ui_off', !visibility.panel_presets);
	dom.btnChatDisplay.toggleClass('ui_off', !visibility.panel_chat);
	dom.btnGraph.toggleClass('ui_off', !visibility.patch_editor);

	$patch_editor.toggle(state.visible && visibility.patch_editor);
	if (andUpdateState) this.updateState();
	this.enforceConstraints();

	var inBuildMode = !visibility.patch_editor,
		inProgramMode = visibility.patch_editor;

	// sync camera buttons
	var worldEditorActive = state.viewCamera === uiViewCam.world_editor;


	dom.btnBuildMode.toggleClass('ui_on', inBuildMode)
		.toggleClass('ui_off', inProgramMode);
	dom.btnProgramMode.toggleClass('ui_on', inProgramMode)
		.toggleClass('ui_off', inBuildMode);

	dom.btnSavePatch.attr('disabled', inBuildMode);
	dom.btnInspector.attr('disabled', inBuildMode);

//  these will still zoom, whatever the mode?
	/*
	dom.btnZoomOut.attr('disabled',isProgramMode);
	dom.btnZoom.attr('disabled',worldEditorActive);
	dom.btnZoomIn.attr('disabled',worldEditorActive);
	*/

	dom.btnMove.attr('disabled',inProgramMode);
	dom.btnScale.attr('disabled',inProgramMode);
	dom.btnRotate.attr('disabled',inProgramMode);
	dom.btnEditorCam.parent().toggleClass('active', worldEditorActive);
	dom.btnVRCam.parent().toggleClass('active', !worldEditorActive);

	if (inProgramMode) {
		dom.tabPresets.find('a').trigger('click');
	} else {
		dom.tabObjects.find('a').trigger('click');
		dom.tabPresets.addClass('inactive ui_off');
	}

	E2.app.noodlesVisible = inProgramMode;
};


/***** TOGGLE LAYERS OF THE UI ON OR OFF *****/
VizorUI.prototype.toggleFloatingPanels = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.floating_panels = forceVisibility;
	else
		v.floating_panels = !v.floating_panels;

	this.applyVisibility();
};

VizorUI.prototype.togglePatchEditor = function(forceVisibility) {
	var v = this.state.visibility;
	if (typeof forceVisibility !== 'undefined')
		v.patch_editor = forceVisibility;
	else
		v.patch_editor = !v.patch_editor;
	this.applyVisibility();

	if (v.patch_editor)
		NodeUI.redrawActiveGraph();
}

VizorUI.prototype.toggleNoodles = VizorUI.prototype.togglePatchEditor; // @deprecated




/***** HELPER METHODS *****/

/**
 * get the state of a UI (tabbed) panel. if no $domElement provided, then _found = false
 * @param $domElement
 * @returns {{_found: boolean, visible: boolean, collapsed: boolean, selectedTab: null, x: boolean, y: boolean}}
 */
VizorUI.getDomPanelState = function($domElement) {	/* @var $domElement jQuery */
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

/**
 * Apply a panelState obtained via VizorUI.getPanelState to a floating panel of the UI
 * @param $el
 * @param panelState
 * @param collapseCallback
 * @returns {boolean}
 */
VizorUI.applyPanelState = function($el, panelState, collapseCallback) {
	if ((typeof $el !== 'object') || ($el.length === 0)) return false;

	// parse state
	// ignores visibility which is already applied
	var collapsed = panelState.collapsed || false;
	var selectedTab = panelState.selectedTab || false;
	var x = panelState.x || 0;
	var y = panelState.y || 0;
	var w = panelState.w || 0;	// w currently ignored
	var h = panelState.h || 0;	// h only applied to chat window


	// collapse if needed
	if (typeof collapseCallback === 'function') {	// collapse callback will collapse the window or not
		if (collapsed) {
			$el.removeClass('collapsed');
		} else {
			$el.addClass('collapsed');
		}
		collapseCallback();
	} else {										// we collapse or expand the window
		if (collapsed) {
			$el.addClass('collapsed');
		} else {
			$el.removeClass('collapsed');
		}
	}

	// position and check dimensions
	if (!((x===0) && (y === 0))) {
		var parent = $el.parent();
		var parentHeight = parent.innerHeight();
		var parentWidth = parent.innerWidth();
		if ((parentWidth>0) && (parentHeight>0)) {
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

	if (!selectedTab) return true;

	// activate the selected tab by triggering a click on the link
	if (selectedTab.indexOf('#') === 0) {	// this is a href, so find link to click
		var $a = $el.find("a[href='"+selectedTab+"']");
		$a.parent().removeClass('active')
		$a.trigger('click');
	} else {
		$el.find("li[data-tabname='"+selectedTab+"'").find('a').trigger('click');
	}

	return true;
};

//called by ui.enforceConstraints
VizorUI.constrainPanel = function($panel, referenceTop, referenceBottom, referenceLeft, doConstrainHeight) {
	if (!$panel.is(':visible')) return false;
	doConstrainHeight = !!(doConstrainHeight || false);
	var panelHeight = $panel.outerHeight(true);
	var panelWidth = $panel.outerWidth(true);
	var parentHeight = $panel.parent().innerHeight();
	var parentWidth = $panel.parent().innerWidth();
	var availableHeight = parentHeight - referenceBottom;	// #652
	var availableWidth = parentWidth;

	var pos = $panel.position();
	if (pos.left === 0) pos = $panel.offset();

	var panelTop = pos.top;
	var panelLeft = pos.left;
	var newX = panelLeft, newY = panelTop, newH = panelHeight;

	if (panelHeight > parentHeight) {
		$panel.height(parentHeight - 10);
	}
	if (panelTop + panelHeight > availableHeight) {	// try to fit this on screen
		if (newH > availableHeight) {
			newH = availableHeight;
		}
		if (newH <= availableHeight) {	// first change the top only
			newY -= ((newY + newH) - availableHeight);
		}
		if (newY < referenceTop) {		// if not enough, change height too
			newH = newH - (referenceTop - newY) - 10;
			newY = referenceTop + 5;
		}
	}
	if (panelLeft + panelWidth > parentWidth) {		// same for x and fixed width
		newX -= ((newX + panelWidth) - availableWidth);
	}
	if (newX < referenceLeft) newX = referenceLeft + 5;

	if (doConstrainHeight) $panel.height(newH);	// only resizable panels take height (i.e. chat)
	$panel.css({top: newY, left: newX});

	return true;
}


VizorUI.getPersistentStorageRef = function() {
	var storage = window.sessionStorage;
	var quotaExceeded = DOMException.QUOTA_EXCEEDED_ERR || 22;
	try {
		storage.setItem('test', 1);
		storage.removeItem('test');
	}
	catch (e) {
		if (e.code === quotaExceeded && storage.length === 0) return null;
	}
	return storage;
}
