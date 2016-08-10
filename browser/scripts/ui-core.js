var uiKeys = {
	enter	: 13,
	shift	: 16,
	ctrl	: 17,
	left_window_key : 91,	// 	cmd, = ctrl (webkit)
	meta	: 224,			// 	cmd firefox ^
	alt		: 18,
	spacebar: 32,

	backspace   : 8,
	delete      : 46,

	// handled on keydown - keycode + modifier value
	toggleMode 			: 9,	// Tab
	togglePatchEditor	: 1009,	// Shift+Tab
	toggleUILayer		: 11085,	// meta+Shift+U
	toggleFloatingPanels : 10066, // meta+B

	toggleDebugFPSDisplay : 101070, // ctrl+meta+shift+F

	// single characters handled on keypress
	openInspector		: 'I',
	toggleEditorCamera	: 'V',
	focusPatchSearch	: '/',
	focusPatchSearchAlt: 'Q',
	viewSource			: '\\',

	modifyModeMove		: 'M',
	modifyModeScale 	: 'S',
	modifyModeRotate	: 'R',
	focusChatPanel		: '@',
	viewHelp 			: '?',

	toggleEditorHelpers                 : 'H',
	toggleWorldEditorGrid               : 'G',
	toggleWorldEditorLocalGlobalHandles : 'L',
	toggleWorldEditorXCamera            : 'X',
	toggleWorldEditorYCamera            : 'Y',
	toggleWorldEditorZCamera            : 'Z',
	toggleWorldEditorOrthographicCamera : 'O',
	frameViewToSelection                : 'T',
	toggleFullScreen 	                : 'F',
	moveVRCameraToEditorCamera          : '=',
	gotoParentGraph		                : ',',

	moveSelectedNodesUp      : 38, // up arrow
	moveSelectedNodesDown    : 40, // down arrow
	moveSelectedNodesLeft    : 37, // left arrow
	moveSelectedNodesRight   : 38, // right arrow

	shortcutKey0 : '0',
	shortcutKey1 : '1',
	shortcutKey2 : '2',
	shortcutKey3 : '3',
	shortcutKey4 : '4',
	shortcutKey5 : '5',
	shortcutKey6 : '6',
	shortcutKey7 : '7',
	shortcutKey8 : '8',
	shortcutKey9 : '9',

	activateHoverSlot : 1016, // shift only activates hover slot
	deselect : 13, // enter = deselect / commit move

	selectAll   : 10065, // meta + A: select all
	copy        : 10067, // meta + C: copy
	cut         : 10088, // meta + X: cut
	paste       : 10086, // meta + V: paste
	undo        : 10090, // meta + Z: undo
	redo        : 11090, // shift + meta + Z: redo

	// added to code in getModifiedKeyCode
	modShift 	: 1000,
	modMeta 	: 10000,	// ctrl == cmd
	modAlt 		: 100000
};

var uiViewCam = {
	vr			: 'hmd',
	birdsEye	: 'birdsEye'
};

var uiEvent = { // emitted by ui (E2.ui) unless comments state otherwise
	initialised		: 'uiInitialised',
	moved			: 'uiMoved',			// panels via movable.js
	resized			: 'uiResized',			// panels via draggable.js
	stateChanged	: 'uiStateChanged'
}


var VizorUI = function() {			// becomes E2.ui
	EventEmitter.apply(this, arguments)

	this._initialised = false;

	this.dom = {				// init sets this to E2.dom
		chatWindow : null,
		patchesLib : null,
		assetsLib : null
	};

	this.state = new UiState(VizorUI.getPersistentStorageRef(), VizorUI.getContext())
	this.state.allowStoreOnChange = false;

	this.flags = {
		loading: false,
		dragging: false,
		fullscreen: false,
		pressedShift: false,
		pressedAlt : false,
		pressedMeta : false		// ctrl or cmd on osx, ctrl on windows
	};
};
VizorUI.prototype = Object.create(EventEmitter.prototype);
VizorUI.prototype.constructor = VizorUI

VizorUI.prototype._init = function(e2) {	// called by .init() in ui.js
	this.dom = e2.dom;
	document.body.addEventListener('keydown', this.onKeyDown.bind(this));
	document.body.addEventListener('keyup', this.onKeyUp.bind(this));
	document.addEventListener('keypress', this.onKeyPress.bind(this), true);	// first
	window.addEventListener('blur', this._onWindowBlur.bind(this));
	window.addEventListener('focus', this._onWindowFocus.bind(this));
	window.addEventListener('resize', this.onWindowResize.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));
}

VizorUI.prototype.refreshBreadcrumb = function() {	// force state to emit an event
	E2.ui.state.selectedObjects = E2.ui.state.selectedObjects
}

VizorUI.prototype.setupStateStoreEventListeners = function() {
	var that = this;
	var dom = this.dom;		// normally E2.dom
	var state = this.state;
	var visibility = state.visibility;
	var $assets = dom.assetsLib, $patches = dom.patchesLib, $chat = dom.chatWindow, $properties = dom.propertiesPanel;
	var $patch_editor = dom.canvas_parent;

	E2.app.graphStore.on('changed:size', function(size) {
		$('#graphSizeLabel').html(siteUI.formatFileSize(size))
	})
	E2.app.graphStore.on('nodeRemoved', function(graph, node){
		var ix = state.selectedObjects.indexOf(node)
		if (ix !== -1) {
			var sel = _.clone(state.selectedObjects)
			sel.splice(ix, 1)
			state.selectedObjects = sel	// refresh
		}
	})

	state
		.on('changed:mode', function(mode) {
			var inBuildMode = mode === uiMode.build
			var inProgramMode = !inBuildMode

			if (inProgramMode)
				E2.track({ event: 'programMode' })
			else
				E2.track({ event: 'buildMode' })

			dom.btnBuildMode
				.toggleClass('ui_on', inBuildMode)
				.toggleClass('ui_off', inProgramMode);
			dom.btnProgramMode
				.toggleClass('ui_on', inProgramMode)
				.toggleClass('ui_off', inBuildMode);

			// LIs
			dom.tabObjects
				.toggleClass('ui_off', inProgramMode)
				.toggleClass('ui_on', inBuildMode)

			dom.tabPatches
				.toggleClass('ui_off', inBuildMode)
				.toggleClass('ui_on', inProgramMode)

			dom.tabObjProperties
				.toggleClass('ui_off', inProgramMode)
				.toggleClass('ui_on', inBuildMode)

			dom.tabNodeProperties
				.toggleClass('ui_off', inBuildMode)
				.toggleClass('ui_on', inProgramMode)


			dom.btnMove.attr('disabled',!inBuildMode);
			dom.btnScale.attr('disabled',!inBuildMode);
			dom.btnRotate.attr('disabled',!inBuildMode);

			if (inBuildMode) {
				dom.tabObjects.find('a').trigger('click')
				dom.tabObjProperties.find('a').trigger('click')
			}
			else if (inProgramMode) {
				dom.tabPatches.find('a').trigger('click')
				dom.tabNodeProperties.find('a').trigger('click')
			}

		})
		.emit('changed:mode', state.mode);

	state
		.on('changed:viewCamera', function(camera){
			var birdsEyeCameraActive = (camera === uiViewCam.birdsEye);
			dom.btnEditorCam.parent().toggleClass('active', birdsEyeCameraActive);
			dom.btnVRCam.parent().toggleClass('active', !birdsEyeCameraActive);
			E2.app.setViewCamera(birdsEyeCameraActive);
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
		.on('changed:visibility:panel_patches', changedVisibilityPanelHandler($patches, dom.btnPatches))
		.on('changed:visibility:panel_properties', 	changedVisibilityPanelHandler($properties, dom.btnInspector))
		.on('changed:visibility:panel_chat', 	changedVisibilityPanelHandler($chat, dom.btnChatDisplay))
		.emit('changed:visibility:panel_assets', 	visibility.panel_assets)
		.emit('changed:visibility:panel_patches', 	visibility.panel_patches)
		.emit('changed:visibility:panel_properties', visibility.panel_properties)
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
				that.dom.tabPatches.find('a').trigger('click')
			}
			dom.btnSavePatch.attr('disabled', !visible);
		})
		.emit('changed:visibility:patch_editor', visibility.patch_editor);

	state
		.on('changed:selectedObjects', function(selected){
			var text = '';
			if (selected) {
				if (selected.length > 1)
					text = selected.length + ' objects';
				else if (selected.length === 1)
					text = selected[0].title || selected[0].id;
			}
			that.buildBreadcrumb(E2.core.active_graph, function(b) {
				if (text)
					b.add(text)
			});
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


	state.on('changed:panelStates:properties', function(panelState){
		if (!panelState) return;
		if (!panelState._found) return;
		if (that.isFullScreen()) return;
		var panel = dom.propertiesPanel
		VizorUI.applyPanelState(panel, panelState);
		var controlsHeight = panel.find('.drag-handle').outerHeight(true) +
					   panel.find('.block-header').outerHeight(true);
		if (!panelState.collapsed) {
			panel.removeClass('collapsed').height('auto');
		} else {
			panel.addClass('collapsed').height(controlsHeight);
		}
		VizorUI.constrainPanel(panel);
	});

	state.on('changed:panelStates:patches', function(panelState){
		if (!panelState) return;
		if (!panelState._found) return;
		if (that.isFullScreen()) return;
		VizorUI.applyPanelState(dom.patchesLib, panelState);
		var controlsHeight = dom.patchesLib.find('.drag-handle').outerHeight(true) +
					   dom.patchesLib.find('.block-header').outerHeight(true) +
					   dom.patchesLib.find('.searchbox').outerHeight(true);
		if (!panelState.collapsed) {
			that.onSearchResultsChange();
		} else {
			dom.patchesLib.addClass('collapsed').height(controlsHeight);
		}
		VizorUI.constrainPanel(dom.patchesLib);
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
		.emit('changed:panelStates:properties', state.panelStates.properties)
		.emit('changed:panelStates:patches', state.panelStates.patches)
		.emit('changed:panelStates:assets', state.panelStates.assets)
		.emit('changed:panelStates:chat', state.panelStates.chat)

	state
		.on('changed:context', function(context){
			// store the panel states and sync again
			that.state.panelStates.chat = VizorUI.getDomPanelState(dom.chatWindow);
			that.state.panelStates.assets = VizorUI.getDomPanelState(dom.assetsLib);
			that.state.panelStates.patches = VizorUI.getDomPanelState(dom.patchesLib);
			that.state.panelStates.properties = VizorUI.getDomPanelState(dom.propertiesPanel);
		})
		.emit('changed:context', state.context)
};

VizorUI.prototype.setDragging = function(isOn) {
	this.flags.dragging = isOn
}

/***** IS... *****/

VizorUI.prototype.isFullScreen = function() {
	return E2.util.isFullscreen()
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
VizorUI.prototype.isDragging = function() {
	return this.flags.dragging;
}
VizorUI.prototype.isLoading = function() {
	return this.flags.loading;
}
VizorUI.prototype.isUploading = function() {
	return this.uploading;
}
VizorUI.prototype.isModalOpen = function() {
	// was: return ($("body").data('bs.modal') || {}).isShown;
	return siteUI.isModalOpen()
}

/**** EVENT HANDLERS ****/

VizorUI.prototype._onWindowBlur = function() {
	// clear modifier keys
	this.flags.pressedMeta = false
	this.flags.pressedAlt = false
	this.flags.pressedShift = false

	// set default modify mode
	this.state.modifyMode = this.state.modifyModeDefault

	return true
}
VizorUI.prototype._onWindowFocus = VizorUI.prototype._onWindowBlur

VizorUI.prototype._trackModifierKeys = function(e) {	// returns bool if any modifiers changed
	var oldMeta = this.flags.pressedMeta,
		oldAlt = this.flags.pressedAlt,
		oldShift = this.flags.pressedShift;
	this.flags.pressedMeta = e.metaKey || e.ctrlKey;
	this.flags.pressedAlt = e.altKey;
	this.flags.pressedShift = e.shiftKey;
	var modifiersChanged = (oldMeta !== this.flags.pressedMeta) ||
							(oldAlt !== this.flags.pressedAlt) ||
							(oldShift !== this.flags.pressedShift)
	return modifiersChanged;
};

VizorUI.prototype.getModifiedKeyCode = function(keyCode) {	// adds modifier keys value to keyCode if necessary
	if (typeof keyCode !== 'number') return keyCode;
	if (this.flags.pressedShift) keyCode += uiKeys.modShift;
	if (this.flags.pressedAlt)   keyCode += uiKeys.modAlt;
	if (this.flags.pressedMeta)  keyCode += uiKeys.modMeta;
	return keyCode;
};

// adds meta+alt+shift (in this order) to key from keyPress
VizorUI.prototype.getModifiedKey = function(key) {
	if (this.flags.pressedShift) key = "shift+" + key;
	if (this.flags.pressedAlt) key = "alt+" + key;
	if (this.flags.pressedMeta) key = "meta+" + key;
	return key;
}

VizorUI.prototype.trackModifierKeysForWorldEditor = function() {
	if (!this.isInBuildMode()) return
	if (this.isDragging()) return

	var flags = this.flags
	var anyModifiersPressed = flags.pressedMeta || flags.pressedShift || flags.pressedAlt

	if (!anyModifiersPressed)
		return anyModifiersPressed

	// 'cmd/ctrl' to rotate
	// 'cmd/ctrl+shift' to scale
	// 'shift' to move

	if (flags.pressedMeta &&  !flags.pressedShift &&  !flags.pressedAlt)
		this.state.modifyMode = uiModifyMode.rotate

	else if (flags.pressedShift && flags.pressedMeta &&  !flags.pressedAlt)
		this.state.modifyMode = uiModifyMode.scale

	else if (flags.pressedShift &&  !flags.pressedAlt &&  !flags.pressedMeta)
		this.state.modifyMode = uiModifyMode.move

	return anyModifiersPressed
}

VizorUI.prototype.onKeyPress = function(e) {
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e) || this.isFullScreen()) return true;
	var state = this.state;
	var that = this;

	var key = e.charCode;
	if (!key) return true;	// if this is 0 then the code does not apply to this handler, because Firefox

	key = String.fromCharCode(key).toUpperCase();	// num->str
	key = this.getModifiedKey(key);					// attach modifiers e.g. shift+M

	// keys for both program and build modes:

	// note dual-case for '/','shift+/' etc depending on keyboard layout
	switch (key) {
		case uiKeys.toggleFullScreen:
			E2.app.toggleFullscreen();
			e.preventDefault();
			break;

		case uiKeys.openInspector:
			state.visibility.panel_properties = !state.visibility.panel_properties
			e.preventDefault();
			break;

		case uiKeys.toggleEditorCamera:
			state.viewCamera = (state.viewCamera === uiViewCam.vr) ? uiViewCam.birdsEye : uiViewCam.vr;
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.toggleEditorHelpers:
			E2.app.toggleHelperObjects()
			break;
		case uiKeys.focusPatchSearchAlt:
		case uiKeys.focusPatchSearch:
		case 'shift+' + uiKeys.focusPatchSearch:
			state.visibility.panel_patches = true;
			if (that.isInProgramMode()) {
				that.dom.tabPatches.find('a').trigger('click')
				that.dom.patches_list.find('.searchbox input').focus().select();
			} else {
				that.dom.tabObjects.find('a').trigger('click')
				that.dom.objectsList.find('.searchbox input').focus().select();
			}
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.focusChatPanel:
		case 'shift+'+uiKeys.focusChatPanel:
			state.visibility.panel_chat = true;
			this.dom.chatWindow.find('#new-message-input').focus();
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.viewHelp:
		case 'shift+'+uiKeys.viewHelp:
			VizorUI.openEditorHelp();
			e.preventDefault();
			e.stopPropagation();
			break;
	}

	// keys for program-mode (noodles visible) only:
	if (this.isInProgramMode()) {
		function openPatchOrPlugin(item) {
			var name = item.substring(7)
			if (item.indexOf('patch:') === 0)
				E2.app.patchManager.openPatch('/patches/' + name + '.json')
			else
				E2.app.instantiatePlugin(name)
		}

		switch(key) {
			case uiKeys.gotoParentGraph:
				if (E2.core.active_graph.parent_graph)
					E2.app.setActiveGraph(E2.core.active_graph.parent_graph)
				break;
			case uiKeys.viewSource:
			case 'shift+' + uiKeys.viewSource:
			case 'alt+shift+' + uiKeys.viewSource:	// .fi
				this.viewSource();
				e.preventDefault();
				break;
			case uiKeys.moveSelectedNodesUp:
				E2.app.executeNodeDrag(
					E2.app.selectedNodes,
					E2.app.selectedConnections,
					0, -10);
				e.preventDefault();
				break;
			case uiKeys.moveSelectedNodesDown:
				E2.app.executeNodeDrag(
					E2.app.selectedNodes,
					E2.app.selectedConnections,
					0, 10);
				e.preventDefault();
				break;
			case uiKeys.moveSelectedNodesLeft:
				E2.app.executeNodeDrag(
					E2.app.selectedNodes,
					E2.app.selectedConnections,
					-10, 0);
				e.preventDefault();
				break;
			case uiKeys.moveSelectedNodesRight:
				E2.app.executeNodeDrag(
					E2.app.selectedNodes,
					E2.app.selectedConnections,
					10, 0);
				e.preventDefault();
				break;
			case uiKeys.shortcutKey0:
				openPatchOrPlugin('plugin:output_proxy');
				break;
			case uiKeys.shortcutKey1:
				openPatchOrPlugin('plugin:input_proxy');
				break;
			case uiKeys.shortcutKey2:
				openPatchOrPlugin('plugin:graph');
				break;
			case uiKeys.shortcutKey3:
				openPatchOrPlugin('plugin:slider_float_generator');
				break;
			case uiKeys.shortcutKey4:
				openPatchOrPlugin('plugin:const_float_generator');
				break;
			case uiKeys.shortcutKey5:
				openPatchOrPlugin('plugin:float_display');
				break;
			case uiKeys.shortcutKey6:
				openPatchOrPlugin('plugin:multiply_modulator');
				break;
			case uiKeys.shortcutKey7:
				openPatchOrPlugin('plugin:vector');
				break;
			case uiKeys.shortcutKey8:
				openPatchOrPlugin('plugin:toggle_button');
				break;
			case uiKeys.shortcutKey9:
				openPatchOrPlugin('plugin:knob_float_generator');
				break;
		}

	}
	else if (E2.app.worldEditor.isActive) {
		if (E2.app.worldEditor.cameraSelector.selectedCamera !== 'vr') {
			// world editor (bird's eye camera only) -specific keys
			switch(key) {
			case uiKeys.toggleWorldEditorXCamera:
				E2.app.worldEditor.setCameraView('-x');
				break;
			case 'shift+' + uiKeys.toggleWorldEditorXCamera:
				E2.app.worldEditor.setCameraView('+x');
				break;
			case uiKeys.toggleWorldEditorYCamera:
				E2.app.worldEditor.setCameraView('-y');
				break;
			case 'shift+' + uiKeys.toggleWorldEditorYCamera:
				E2.app.worldEditor.setCameraView('+y');
				break;
			case uiKeys.toggleWorldEditorZCamera:
				E2.app.worldEditor.setCameraView('-z');
				break;
			case 'shift+' + uiKeys.toggleWorldEditorZCamera:
				E2.app.worldEditor.setCameraView('+z');
				break;
			case uiKeys.toggleWorldEditorOrthographicCamera:
				E2.app.worldEditor.toggleCameraOrthographic();
				break;
			case uiKeys.frameViewToSelection:
				E2.app.worldEditor.frameSelection();
				break;
			case uiKeys.moveVRCameraToEditorCamera:
			case "shift+"+uiKeys.moveVRCameraToEditorCamera: // fi
				E2.app.worldEditor.matchVRToEditorCamera();
				break;
			}
		}

		// world editor (any camera) -specific keys
		switch(key) {
			case uiKeys.modifyModeMove:
				state.modifyModeDefault = uiModifyMode.move
				state.modifyMode = state.modifyModeDefault
				break;
			case uiKeys.modifyModeRotate:
				state.modifyModeDefault = uiModifyMode.rotate
				state.modifyMode = state.modifyModeDefault
				break;
			case uiKeys.modifyModeScale:
				state.modifyModeDefault = uiModifyMode.scale
				state.modifyMode = state.modifyModeDefault
				break;
			case uiKeys.toggleWorldEditorLocalGlobalHandles:
				E2.app.worldEditor.toggleLocalGlobalHandles();
				break;
			case uiKeys.toggleWorldEditorGrid:
				E2.app.worldEditor.toggleGrid();
				break;
		}
	}

	return true;
};

VizorUI.prototype.onKeyDown = function(e) {
	var modifiersChanged = this._trackModifierKeys(e);
	if (this.isModalOpen() || E2.util.isTextInputInFocus(e) || this.isFullScreen()) return true;
	if (this.isDragging()) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	}

	var state = this.state;
	var that = this;
	var modifiedKeyCode = this.getModifiedKeyCode(e.keyCode);

	if (modifiersChanged)
				this.trackModifierKeysForWorldEditor()

	switch (modifiedKeyCode) {
		case uiKeys.toggleFloatingPanels:
			this.toggleFloatingPanels();
			e.preventDefault();
			break;
		case uiKeys.toggleMode:
			if (state.mode === uiMode.build)
				that.setModeProgram();
			else
				that.setModeBuild();
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.togglePatchEditor:
			this.togglePatchEditor();
			e.preventDefault();
			break;
		case uiKeys.toggleUILayer:
			that.toggleUILayer();
			e.preventDefault();
			break;
		case uiKeys.backspace:
		case uiKeys.delete:
			E2.app.onDelete(e);
			e.preventDefault();
			break;
		case uiKeys.deselect: // enter = deselect (eg. commit move)
			E2.app.clearEditState();
			E2.app.clearSelection();
			break;
		case uiKeys.activateHoverSlot:
			E2.app.activateHoverSlot();
			break;
		case uiKeys.selectAll:
			E2.app.selectAll();
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.copy:
			if (VizorUI.isBrowser.Chrome())
				return;
			E2.app.onCopy(e);
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.cut:
			if (VizorUI.isBrowser.Chrome())
				return;
			E2.app.onCut(e);
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.paste:
			if (VizorUI.isBrowser.Chrome())
				return;
			E2.app.onPaste();
			e.preventDefault();
			e.stopPropagation();
			break;
		case uiKeys.undo:
			e.preventDefault();
			e.stopPropagation();
			E2.app.undoManager.undo();
			this.emit('undo')
			break;
		case uiKeys.redo:
			e.preventDefault();
			e.stopPropagation();
			E2.app.undoManager.redo();
			this.emit('redo')
			break;
		case uiKeys.toggleDebugFPSDisplay:
			e.preventDefault();
			e.stopPropagation();
			E2.app.debugFpsDisplayVisible = !E2.app.debugFpsDisplayVisible
			break;
	}
	return true;
}
VizorUI.prototype.onKeyUp = function(e) {
	var modifiersChanged = this._trackModifierKeys(e);

	if (modifiersChanged) {
		var anyModifiersPressed = this.trackModifierKeysForWorldEditor()
		if (anyModifiersPressed === false)
			this.state.modifyMode = this.state.modifyModeDefault
	}

	if (this.isModalOpen() || E2.util.isTextInputInFocus(e) || this.isFullScreen()) return true;

	if(e.keyCode === uiKeys.shift)
	{
		E2.app.releaseHoverSlot();
		E2.app.releaseHoverNode(false);
	}
	return true;
};

VizorUI.prototype.constrainAllPanels = function() {
	VizorUI.constrainPanel(this.dom.chatWindow)
	VizorUI.constrainPanel(this.dom.patchesLib)
	VizorUI.constrainPanel(this.dom.assetsLib)
	VizorUI.constrainPanel(this.dom.propertiesPanel)
}

VizorUI.prototype.onWindowResize = function() {
	this.constrainAllPanels()
	this.state.context = VizorUI.getContext();
	this.flags.fullscreen = this.isFullScreen();
	return true;
};



/***** HELPER METHODS *****/

VizorUI.getControlTypeForDt = function(dt) {
	var types = E2.core.datatypes
	switch (dt) {
		case types.BOOL:
			return UICheckbox
		case types.FLOAT:
			return UIFloatField
		case types.TEXT:
			return UITextField
		case types.VECTOR:
			return UIVector3
	}
	return false
}

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
			tabName = $activeLi.data('tabname');			// data-tabname='patches' preferred
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


// separate function so it can be removed
VizorUI._disableEvent = function(e) {
	e.preventDefault()
	e.stopPropagation()
	return false
}

VizorUI.disableContextMenu = function(domElement) {
	domElement.addEventListener('contextmenu', VizorUI._disableEvent, true)		// top down
}