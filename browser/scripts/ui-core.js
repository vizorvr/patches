var uiKeys = {
	enter: 13,
	shift : 16,
	ctrl: 17,						// 	ctrl
	left_window_key : 91,			// 	cmd, = ctrl for us
	meta : 224,						// 	firefox
	alt: 18,
	spacebar: 32,

	openInspector	: 73,			//	i
	viewHelp		: 1191,			//  ?
	toggleUILayer	: 11085,		// 	cmd/ctrl + shift + u,
	toggleMode 		: 9,			// 	tab
	togglePatchEditor: 	1009,		//  shift+tab
	toggleEditorCamera: 86,			//  v
	toggleFullScreen : 70,			// 	f,
	toggleFloatingPanels : 10066,	// 	cmd/ctrl + b
	focusPresetSearch: 191,			//	/
	focusPresetSearchAlt: 81,		//  q
	viewSource:		220,			//	\
	setVRCameraPositionToEditorCameraPosition: 187,		// =

	modifyModeMove	: 77,			// m
	modifyModeScale : 83,			// s
	modifyModeRotate: 82,			// r

	focusChatPanel: 'U+0040',		// @ - this key moves so is checked by value/identifier
	focusChatPanelAlt: '@',			//
	openHelpAlt : '?',


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
	resized			: 'uiResized',			// panels via draggable.js
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

	this.state = new UiState(VizorUI.getPersistentStorageRef(), VizorUI.getContext())
	this.state.allowStoreOnChange = false;

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
	window.addEventListener('focus', this._clearModifierKeys.bind(this));
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));
}



VizorUI.prototype.setupStateStoreEventListeners = function() {
	var that = this;
	var dom = this.dom;		// normally E2.dom
	var state = this.state;
	var visibility = state.visibility;
	var $assets = dom.assetsLib, $presets = dom.presetsLib, $chat = dom.chatWindow;
	var $patch_editor = dom.canvas_parent;


	state
		.on('changed:mode', function(mode) {
			var inBuildMode = mode === uiMode.build
			var inProgramMode = !inBuildMode

			dom.btnBuildMode
				.toggleClass('ui_on', inBuildMode)
				.toggleClass('ui_off', inProgramMode);
			dom.btnProgramMode
				.toggleClass('ui_on', inProgramMode)
				.toggleClass('ui_off', inBuildMode);

			// LIs
			dom.tabObjects
				.toggleClass('disabled', inProgramMode)
				.toggleClass('ui_off', inProgramMode)
				.toggleClass('ui_on', inBuildMode)

			dom.tabPresets
				.toggleClass('disabled', inBuildMode)
				.toggleClass('ui_off', inBuildMode)
				.toggleClass('ui_on', inProgramMode)

			dom.btnMove.attr('disabled',!inBuildMode);
			dom.btnScale.attr('disabled',!inBuildMode);
			dom.btnRotate.attr('disabled',!inBuildMode);

			if (inBuildMode) dom.tabObjects.find('a').trigger('click')
			else if (inProgramMode) dom.tabPresets.find('a').trigger('click')

		})
		.emit('changed:mode', state.mode);

	state
		.on('changed:viewCamera', function(camera){
			var worldEditorActive = (camera === uiViewCam.world_editor);
			dom.btnEditorCam.parent().toggleClass('active', worldEditorActive);
			dom.btnVRCam.parent().toggleClass('active', !worldEditorActive);
			E2.app.toggleWorldEditor(worldEditorActive);
		})
		.emit('changed:viewCamera', state.viewCamera);

	// nothing UI for top-level 'changed:visible' to process

	state
		.on('changed:visibility:floating_panels', function(visible){
			that.dom.btnHideAll.toggleClass('ui_off', visible);	// inverse
		})
		.emit('changed:visibility:floating_panels', visibility.floating_panels);


	var changedVisibilityPanelHandler = function($panel, $button) {
		return function(visible){
			if (that.isFullScreen()) return;
			$panel
				.toggle(visible)
				.toggleClass('uiopen', visible);
			$button.toggleClass('ui_off', !visible);

			if (visible) VizorUI.constrainPanel($panel);	// soft constrain
		};
	};

	state
		.on('changed:visibility:panel_assets', 	changedVisibilityPanelHandler($assets, dom.btnAssets))
		.on('changed:visibility:panel_presets', changedVisibilityPanelHandler($presets, dom.btnPresets))
		.on('changed:visibility:panel_chat', 	changedVisibilityPanelHandler($chat, dom.btnChatDisplay))
		.emit('changed:visibility:panel_assets', 	visibility.panel_assets)
		.emit('changed:visibility:panel_presets', 	visibility.panel_presets)
		.emit('changed:visibility:panel_chat', 		visibility.panel_chat);

	state
		.on('changed:visibility:patch_editor', function(visible){
			E2.app.noodlesVisible = visible;
			$patch_editor.toggle(E2.app.noodlesVisible);	// ui is visible and patch editor is visible (or not)
			if (E2.app.noodlesVisible) NodeUI.redrawActiveGraph();
			if (that.isInBuildMode() && !that.state.visibility.patch_editor) {
					that.dom.tabObjects.find('a').trigger('click')
			}
			if (that.isInProgramMode() && that.state.visibility.patch_editor) {
				that.dom.tabPresets.find('a').trigger('click')
			}
			dom.btnSavePatch.attr('disabled', !visible);
			dom.btnInspector.attr('disabled', !visible);
		})
		.emit('changed:visibility:patch_editor', visibility.patch_editor);

	state
		.on('changed:selectedObjects', function(selected){
			var what = '';
			if (selected.length > 1) what = selected.length + ' objects';
			else if (selected.length === 1) what = selected[0].title || selected[0].id;
			that.buildBreadcrumb(E2.core.active_graph, function(b){if (what) b.add(what)});
		})
		.emit('changed:selectedObjects', state.selectedObjects);

	state
		.on('changed:modifyMode', function(modifyMode){
			dom.btnScale
				.toggleClass('ui_off', modifyMode !== uiModifyMode.scale)
				.toggleClass('ui_on', modifyMode === uiModifyMode.scale)
			dom.btnRotate
				.toggleClass('ui_off', modifyMode !== uiModifyMode.rotate)
				.toggleClass('ui_on', modifyMode === uiModifyMode.rotate)
			dom.btnMove
				.toggleClass('ui_off', modifyMode !== uiModifyMode.move)
				.toggleClass('ui_on', modifyMode === uiModifyMode.move)
		})
		.emit('changed:modifyMode', state.modifyMode);

	state.on('changed:panelStates:presets', function(panelState){
		if (!panelState) return;
		if (!panelState._found) return;
		if (that.isFullScreen()) return;
		VizorUI.applyPanelState(dom.presetsLib, panelState);
		var controlsHeight = dom.presetsLib.find('.drag-handle').outerHeight(true) +
					   dom.presetsLib.find('.block-header').outerHeight(true) +
					   dom.presetsLib.find('.searchbox').outerHeight(true);
		if (!panelState.collapsed) {
			that.onSearchResultsChange();
		} else {
			dom.presetsLib.addClass('collapsed').height(controlsHeight);
		}
		VizorUI.constrainPanel(dom.presetsLib);
	});

	state.on('changed:panelStates:assets', function(panelState){
		if (!panelState) return;
		if (!panelState._found) return;
		if (that.isFullScreen()) return;
		VizorUI.applyPanelState(dom.assetsLib, panelState);
		var controlsHeight = dom.assetsLib.find('.drag-handle').outerHeight(true) +
					   dom.assetsLib.find('.block-header').outerHeight(true) +
					   dom.assetsLib.find('.searchbox').outerHeight(true);
		if (E2.dom.assetsLib.hasClass('collapsed')) {
			var newHeight = controlsHeight +
						   dom.assetsLib.find('#assets-tabs').outerHeight(true) +
						   dom.assetsLib.find('.tab-content.active .assets-frame').outerHeight(true) +
						   dom.assetsLib.find('.load-buttons').outerHeight(true) +
						   dom.assetsLib.find('#asset-info').outerHeight(true)
			dom.assetsLib.removeClass('collapsed').height(newHeight);
		} else {
			dom.assetsLib.addClass('collapsed').height(controlsHeight);
		}
		VizorUI.constrainPanel(dom.assetsLib);
	});

	state.on('changed:panelStates:chat', function(panelState){
		if (!panelState) return;
		if (!panelState._found) return;
		if (that.isFullScreen()) return;
		var $chat = dom.chatWindow;
		VizorUI.applyPanelState($chat, panelState);
		var $resizeHandle = $chat.find('.resize-handle');
		var chatTabsHeight = dom.chatTabs.height();
		var dragHandleHeight = $chat.find('.drag-handle').height();

		if (panelState.collapsed) {
			$resizeHandle.hide();
			$chat.height(dragHandleHeight + chatTabsHeight);
		} else {
			$resizeHandle.show();
			var height = (panelState.h >= 120) ? panelState.h : 'auto';
			$chat.height(height)
			VizorUI.constrainPanel($chat, true);
			that.onChatResize();
		}
	});

	state
		.emit('changed:panelStates:presets', state.panelStates.presets)
		.emit('changed:panelStates:assets', state.panelStates.assets)
		.emit('changed:panelStates:chat', state.panelStates.chat)

	state
		.on('changed:context', function(context){
			// store the panel states and sync again
			that.state.panelStates.chat = VizorUI.getDomPanelState(dom.chatWindow);
			that.state.panelStates.assets = VizorUI.getDomPanelState(dom.assetsLib);
			that.state.panelStates.presets = VizorUI.getDomPanelState(dom.presetsLib);
		})
		.emit('changed:context', state.context)
};


/***** IS... *****/

VizorUI.prototype.isFullScreen = function() {
	return !!(document.mozFullScreenElement || document.webkitFullscreenElement)
}
VizorUI.prototype.isVisible = function() {
	return this.state.visible;
}
VizorUI.prototype.isPatchEditorVisible = function() {
	return this.state.visibility.patch_editor;
}
VizorUI.prototype.isInProgramMode = function() {
	return this.state.mode === uiMode.program
}
VizorUI.prototype.isInBuildMode = function() {
	return this.state.mode === uiMode.build
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
	return $modal.hasClass('in');
}
VizorUI.prototype.isAnyUIElementVisible = function() {
	var state = this.state, v = state.visibility;
	var x = state.visible;
	var anyFloatingPanels = v.floating_panels && (v.panel_presets || v.panel_assets || v.panel_chat)
	x = x && (v.patch_editor || anyFloatingPanels);
	return x;
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
			return true;
		case uiKeys.alt:
			this.flags.key_alt_pressed = newvalue;
			return true;
		case uiKeys.shift:
			this.flags.key_shift_pressed = newvalue;
			return true;
	}
	return false;
};
VizorUI.prototype.getModifiedKeyCode = function(keyCode) {	// adds modifier keys value to keyCode if necessary
	if (typeof keyCode !== 'number') return keyCode;
	if (this.flags.key_shift_pressed) keyCode += uiKeys.mod_shift;
	if (this.flags.key_alt_pressed) keyCode += uiKeys.mod_alt;
	if (this.flags.key_ctrl_pressed) keyCode += uiKeys.mod_ctrl;
	return keyCode;
};
VizorUI.prototype.trackModifierKeysForWorldEditor = function() {
	if (!this.isInBuildMode()) return;

	if (!this.flags.key_shift_pressed && this.flags.key_ctrl_pressed) {
		this.state.modifyMode = uiModifyMode.rotate
	}
	if (this.flags.key_shift_pressed && this.flags.key_ctrl_pressed) {
		this.state.modifyMode = uiModifyMode.scale
	}
	if (!this.flags.key_shift_pressed && !this.flags.key_ctrl_pressed) {
		this.state.modifyMode = uiModifyMode.move
	}
}
VizorUI.prototype.onKeyDown = function(e) {
	var isModifierKey = this._trackModifierKeys(e.keyCode, true);

	if (this.isModalOpen() || E2.util.isTextInputInFocus(e) || this.isFullScreen()) return true;
	var keyCode = this.getModifiedKeyCode(e.keyCode);

	var state = this.state;
	var that = this;

	if (isModifierKey) this.trackModifierKeysForWorldEditor();
	switch (keyCode) {
		case (uiKeys.modifyModeMove):
			this.state.modifyMode = uiModifyMode.move;
			break;
		case (uiKeys.modifyModeRotate):
			this.state.modifyMode = uiModifyMode.rotate;
			break;
		case (uiKeys.modifyModeScale):
			this.state.modifyMode = uiModifyMode.scale;
			break;
		case (uiKeys.viewSource):
			this.viewSource();
			e.preventDefault();
			break;
		case (uiKeys.openInspector):
			this.onInspectorClicked();
			e.preventDefault();
			break;
		case (uiKeys.toggleFloatingPanels):
			this.toggleFloatingPanels();
			e.preventDefault();
			break;
		case (uiKeys.toggleMode):
			if (state.mode === uiMode.build)
				that.setModeProgram();
			else
				that.setModeBuild();
			e.preventDefault();
			e.stopPropagation();
			break;
		case (uiKeys.toggleEditorCamera):
			state.viewCamera = (state.viewCamera === uiViewCam.vr) ? uiViewCam.world_editor : uiViewCam.vr;
			e.preventDefault();
			e.stopPropagation();
			break;
		case (uiKeys.togglePatchEditor):
			this.togglePatchEditor();
			e.preventDefault();
			break;
		case (uiKeys.toggleUILayer):
			that.toggleUILayer();
			e.preventDefault();
			break;
		case (uiKeys.focusPresetSearchAlt):	// fallthrough
		case (uiKeys.focusPresetSearch):
			state.visibility.panel_presets = true;
			if (that.isInProgramMode()) {
				that.dom.tabPresets.find('a').trigger('click')
				that.dom.presets_list.find('.searchbox input').focus().select();
			} else {
				that.dom.tabObjects.find('a').trigger('click')
				that.dom.objectsList.find('.searchbox input').focus().select();
			}
			e.preventDefault();
			e.stopPropagation();
			break;
		case (uiKeys.viewHelp):
			VizorUI.openEditorHelp();
			e.preventDefault();
			e.stopPropagation();
			break;
	}

	var keyIdentifier = (typeof e.keyIdentifier !== 'undefined') ? e.keyIdentifier : (e.key || '');
	switch (keyIdentifier) {
		case uiKeys.focusChatPanel:		// fallthrough
		case uiKeys.focusChatPanelAlt:
			var v = state.visibility.panel_chat = true;
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
VizorUI.prototype.onKeyUp = function(e) {
	var isModifierKey = this._trackModifierKeys(e.keyCode, false);
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e) || this.isFullScreen()) return true;
	if (isModifierKey) this.trackModifierKeysForWorldEditor();
	var keyCode = this.getModifiedKeyCode(e.keyCode);
	// ...
	return true;
};

VizorUI.prototype.onFullScreenChanged = function() {	// placeholder
	this.flags.fullscreen = this.isFullScreen();
	return true;
};

VizorUI.prototype.onWindowResize = function() {
	this.state.context = VizorUI.getContext();
	return true;
};



/***** HELPER METHODS *****/

VizorUI.getContext = function() {
	return {
		width 			: window.innerWidth  || document.documentElement.clientWidth  || document.body.clientWidth,
		height 			: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
		screenWidth		: window.screen.width,
		screenHeight	: window.screen.height,
		availWidth		: window.screen.availWidth,
		availHeight		: window.screen.availHeight
	}
};

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
 * @returns {boolean}
 */
VizorUI.applyPanelState = function($el, panelState) {
	if ((typeof $el !== 'object') || ($el.length === 0)) return false;
	if (!panelState) {
		msg("ERROR: no panelState to apply");
		return false;
	}

	// parse state
	// ignores visibility which is already applied
	var collapsed = !!panelState.collapsed;
	var selectedTab = panelState.selectedTab || false;
	var x = panelState.x || 0;
	var y = panelState.y || 0;
	var w = panelState.w || 0;	// w currently ignored
	var h = panelState.h || 0;	// h only applied to chat window


	// collapse if needed
	$el.toggleClass('collapsed', collapsed);

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

		// $el.height(h);	// currently ignored
	}

	if (!selectedTab) return true;

	// activate the selected tab
	jQuery('.tab-content>.tab-pane', $el).hide().removeClass('active');
	jQuery('.tab-content', $el).find(selectedTab).show().addClass('active');
	jQuery('.nav-tabs li', $el).removeClass('active');
	jQuery('a[href="' + selectedTab + '"]', $el).parent().addClass('active');

	return true;
};

VizorUI.constrainPanel = function($panel, doConstrainHeight, referenceTop, referenceBottom, referenceLeft) {
	var viewport = E2.dom.canvases;
	referenceTop	= referenceTop || 0;
	referenceBottom	= referenceBottom || 0;	// #652
	referenceLeft	= referenceLeft || 0;
	doConstrainHeight = !!doConstrainHeight;

	if (!$panel.is(':visible')) return false;	// jQuery

	var panelHeight = $panel.outerHeight(true);
	var panelWidth = $panel.outerWidth(true);
	var parentHeight = $panel.parent().innerHeight();
	var parentWidth = $panel.parent().innerWidth();
	var availableHeight =  viewport.outerHeight(true);
	var availableWidth = viewport.outerWidth(true);

	var doConstrain = false;

	var pos = $panel.position();
	if (pos.left === 0) pos = $panel.offset();

	var panelTop = pos.top;
	var panelLeft = pos.left;
	var newX = panelLeft, newY = panelTop, newH = panelHeight;

	if (panelHeight > parentHeight) {
		$panel.height(parentHeight - 10);
		doConstrain = true;
	}
	if (panelTop + panelHeight > availableHeight) {	// try to fit this on screen
		doConstrain = true;
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
		doConstrain = true;
		newX -= ((newX + panelWidth) - availableWidth);
	}
	if (newX < referenceLeft) {
		newX = referenceLeft + 5;
		doConstrain = true;
	}

	if (doConstrain) {
		if (doConstrainHeight) $panel.height(newH);	// only resizable panels take height (i.e. chat)
		$panel.css({top: newY, left: newX});
	}

	return doConstrain;
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
