var uiKeys = {
	enter: 13,
	shift : 16,
	ctrl: 17,						// 	ctrl
	left_window_key : 91,			// 	cmd, = ctrl for us
	meta : 224,						// 	firefox
	alt: 18,
	spacebar: 32,

	togglePatchEditor : 9,			// 	tab,
	toggleFullScreen : 70,			// 	f,
	toggleFloatingPanels : 66,		// 	(ctrl+) b
	focusPresetSearch: 191,			//	/
	focusPresetSearchAlt: 81,		//  q

	focusChatPanel: 'U+0040',		// @ - this key moves so is checked by value/identifier
	focusChatPanelAlt: '@',			//

	mod_shift : 1000,
	mod_ctrl : 10000,
	mod_alt : 100000
};



VizorUI = function VizorUI() {	// E2.ui
	var that = this;
	this.$modal = jQuery('div.bootbox.modal');
	this.visible = true;		// overall visibility of the UI
	this.visibility = {			// granular flags
		floating_panels: true,
		panel_chat: true,
		panel_assets: true,
		panel_presets: true,
		patch_editor: true,
		breadcrumb: true,
		player_controls : true,
		main_toolbar : true
	};
	this.flags = {
		loading: false,
		fullscreen: false,
		must_return_panels_with_patch_editor : false,	// set if tab did hide panels too
		key_shift_pressed: false,
		key_alt_pressed : false,
		key_ctrl_pressed : false		// ctrl or cmd on osx, ctrl on windows
	};
	this.always_track_keys = [			// always update ui.flags with the status of these keys
		uiKeys.alt, uiKeys.shift, uiKeys.ctrl, uiKeys.left_window_key, uiKeys.meta
	];
};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2);
	e2.app.onSignInClicked = this.openLoginModal;
	e2.app.onSearchResultsChange = this.onSearchResultsChange;
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChangeRequested', this.onFullScreenChangeRequested.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));
	window.addEventListener('keydown', this.onKeyDown.bind(this));
	window.addEventListener('keyup', this.onKeyUp.bind(this));
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

/***** LOADING *****/
// VizorUI.prototype.setLoadingStatus = function(is_loading) {}
VizorUI.prototype.hideLoadingIndicator = function() {
	E2.ui.updateProgressBar(100);
}
VizorUI.prototype.showLoadingIndicator = function() {
	E2.ui.updateProgressBar(10);
}

/***** MODAL DIALOGS/WINDOWS *****/
VizorUI.prototype.isModalOpen = function() {
	// was: return ($("body").data('bs.modal') || {}).isShown;
	this.visibility.modal = this.$modal.hasClass('in');
	return this.visibility.modal;
}
// stubs
// VizorUI.prototype.openModal
// VizorUI.prototype.closeModal

VizorUI.prototype.openLoginModal = function() {
	return E2.controllers.account.openLoginModal();
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
		case (uiKeys.toggleFloatingPanels + uiKeys.mod_ctrl):
			this.toggleFloatingPanels();
			e.preventDefault();
			break;
		case (uiKeys.togglePatchEditor):
			this.togglePatchEditor();
			this.syncFloatingPanelsVisibility();
			if (!this.visibility.patch_editor) {
				// set us a reminder to return panels next time
				this.flags.must_return_panels_with_patch_editor = this.visibility.floating_panels;
				this.toggleFloatingPanels(false);	// force hide panels
			} else {
				if (this.flags.must_return_panels_with_patch_editor) {
					this.flags.must_return_panels_with_patch_editor = false;
					this.toggleFloatingPanels(true);	// force show panels
				}
			}
			e.preventDefault();
			break;
		case (uiKeys.focusPresetSearchAlt):
		case (uiKeys.focusPresetSearch):
			$('#presetSearch').focus().select();
			e.preventDefault();
			e.stopPropagation();
			break;
	}

	var keyIdentifier = (typeof e.keyIdentifier != 'undefined') ? e.keyIdentifier : (e.key || '');
	switch (keyIdentifier) {
		case uiKeys.focusChatPanel:
		case uiKeys.focusChatPanelAlt:
			E2.dom.chatWindow.show().find('#new-message-input').focus();
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

VizorUI.prototype.onFullScreenChangeRequested = function() {	// placeholder
	this.flags.fullscreen = this.isFullScreen();
	return true;
};

VizorUI.prototype.onWindowResize = function() {	// placeholder
	return true;
};

VizorUI.prototype.onSearchResultsChange = function() {
	var resultsCount = $('.result.table tbody').children().length;
	if (resultsCount>0) {
		E2.dom.presetsLib.removeClass('collapsed');
		E2.dom.presetsLib.find('.preset-list-container').show();
		var resultsHeight = $('.result.table').outerHeight(true);
		var maxHeight = E2.dom.presetsLib.find('.preset-list-container').css('maxHeight')
		var newHeight = resultsHeight;
		newHeight = ( newHeight >= maxHeight ) ? (maxHeight) : (newHeight);
		E2.dom.presetsLib.height('auto')
						 .find('.preset-list-container').height(newHeight);
	}
	 else {
		E2.dom.presetsLib.height('auto');
	}
}

VizorUI.prototype.openPresetSaveDialog = function(serializedGraph) {
	var that = this
	var username = E2.models.user.get('username')
	if (!username) {
		return E2.controllers.account.openLoginModal()
	}

	var presetsPath = '/'+username+'/presets/'

	E2.ui.updateProgressBar(65);

	$.get(presetsPath, function(files) {
		var fcs = new FileSelectControl()
		.frame('save-frame')
		.template('preset')
		.buttons({
			'Cancel': function() {
				E2.ui.updateProgressBar(100);
			},
			'Save': function(name) {
				if (!name)
					return bootbox.alert('Please enter a name for the preset')

				serializedGraph = serializedGraph || that.player.core.serialise()

				$.ajax({
					type: 'POST',
					url: presetsPath,
					data: {
						name: name,
						graph: serializedGraph
					},
					dataType: 'json',
					success: function(saved) {
						E2.ui.updateProgressBar(100);
						that.presetManager.refresh()
					},
					error: function(x, t, err) {
						E2.ui.updateProgressBar(100);

						if (x.status === 401)
							return E2.controllers.account.openLoginModal();

						if (x.responseText)
							bootbox.alert('Save failed: ' + x.responseText);
						else
							bootbox.alert('Save failed: ' + err);
					}
				});
			}
		})
		.files(files)
		.modal();

		return fcs;
	})
};

VizorUI.prototype.syncFloatingPanelsVisibility = function() {
	var $assets = E2.dom.assetsLib, $presets = E2.dom.presetsLib, $chat = E2.dom.chatWindow;
	this.visibility.panel_assets = $assets.hasClass('uiopen');
	this.visibility.panel_presets = $presets.hasClass('uiopen');
	this.visibility.panel_chat = $chat.hasClass('uiopen');
};

VizorUI.prototype.updateFloatingPanelsVisibility = function() {
	var $assets = E2.dom.assetsLib, $presets = E2.dom.presetsLib, $chat = E2.dom.chatWindow;
	if (this.visibility.floating_panels && this.visibility.panel_assets)
		$assets.show();
	else
		$assets.hide();

	if (this.visibility.floating_panels && this.visibility.panel_presets)
		$presets.show();
	else
		$presets.hide();

	if (this.visibility.floating_panels && this.visibility.panel_chat)
		$chat.show();
	else
		$chat.hide();
};

VizorUI.prototype.toggleFscreenVrviewButtons = function() {
	var vr = false; // place E2 VR device check here;
	E2.dom.fscreen.parent.toggle(!vr);
	E2.dom.vrview.parent.toggle(vr);
}
VizorUI.prototype.toggleFloatingPanels = function(forceVisibility, visibilityFlags) {
	if (typeof forceVisibility != 'undefined')
		this.visibility.floating_panels = forceVisibility;
	else
		this.visibility.floating_panels = !this.visibility.floating_panels;

	this.updateFloatingPanelsVisibility();
};

VizorUI.prototype.toggleNoodles = function(forceVisibility) {
	if (typeof forceVisibility != 'undefined')
		this.visibility.patch_editor = forceVisibility;
	else
		this.visibility.patch_editor = !this.visibility.patch_editor;
	E2.dom.canvas_parent.toggle(this.visibility.patch_editor);
	E2.app.noodlesVisible = this.visibility.patch_editor;
}
VizorUI.prototype.togglePatchEditor = VizorUI.prototype.toggleNoodles;


/***** MISC UI MODALS/DIALOGS *****/

VizorUI.prototype.showFirstTimeDialog = function() {
	if (!E2.util.isFirstTime())
		return;

	Cookies.set('vizor050', { seen: 1 }, { expires: Number.MAX_SAFE_INTEGER })

	var firstTimeTemplate = E2.views.account.firsttime;
	var diag = bootbox.dialog({
		title: 'First time here?',
		message: '<h4>Check out our '+
			'<a href="https://www.youtube.com/channel/UClYzX_mug6rxkCqlAKdDJFQ" target="_blank">Youtube tutorials</a> '+
			'or<br>'+
			'drop by <a href="http://twitter.com/Vizor_VR" target="_blank">our Twitter</a> and say hello. </h4>',
		onEscape: true,
		html: true
	}).init(function() {
		E2.app.useCustomBootboxTemplate(firstTimeTemplate);
	});

	diag.find('.modal-dialog').addClass('welcome');

	diag.find('a.login').on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		E2.controllers.account.openLoginModal();
	});

	diag.find('button.signup').on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		E2.controllers.account.openSignupModal();
	});

	diag.find('button#welcome-new').on('click', function()
	{
		E2.app.onNewClicked();
	});

}

VizorUI.prototype.updateProgressBar = function(percent) {
	E2.dom.progressBar = $('#progressbar');
	
	if (!E2.dom.progressBar.is(':visible'))
		E2.dom.progressBar.show().width(1);
	
	var winWidth = $(window).width();
	var barWidth = E2.dom.progressBar.width();
	var newWidth = winWidth / 100 * percent;
	var barSpace = winWidth - barWidth;
	var barSpeed = 2000 - percent * 12;
	
	percent = (percent === 0) ? (barWidth / newWidth + 5) : (percent);
	newWidth = (newWidth <= barWidth) ? (barSpace / 100 * percent + barWidth) : (newWidth);
	
	E2.dom.progressBar.stop().animate({width: newWidth}, {duration: barSpeed, easing: 'linear', complete: function() {
		if ($(this).width() === winWidth)
			$(this).fadeOut('slow');
	}});
}
