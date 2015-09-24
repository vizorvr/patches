VizorUI = function VizorUI() {	// E2.ui
	var that = this;
	this.$modal = jQuery('div.bootbox.modal');
	this.visible = true;		// overall visibility of the UI
	this.visibility = {		// granular flags
		floating_panels: true,
		noodles: true,
		breadcrumb: true,
		player_controls : true,
		main_toolbar : true
	};
	this.flags = {
		loading: false,
		fullscreen: false
	};
};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2);
	e2.app.onSignInClicked = this.openLoginModal;
	e2.app.onSearchResultsChange = this.onSearchResultsChange;
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChangeRequested', this.onFullScreenChangeRequested.bind(this));
	e2.core.on('progress', this.updateProgressBar.bind(this));
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

VizorUI.prototype.toggleFloatingPanels = function() {
	var v = this.visibility.floating_panels = !this.visibility.floating_panels;
	if (E2.dom.assetsLib.hasClass('open'))
		E2.dom.assetsLib.toggle(v)

	if (E2.dom.presetsLib.hasClass('open'))
		E2.dom.presetsLib.toggle(v)

	if (E2.dom.chatWindow.hasClass('open'))
		E2.dom.chatWindow.toggle(v)
};

VizorUI.prototype.toggleFscreenVrviewButtons = function() {
	var vr = false; // place E2 VR device check here;
	E2.dom.fscreen.parent.toggle(!vr);
	E2.dom.vrview.parent.toggle(vr);
}


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

