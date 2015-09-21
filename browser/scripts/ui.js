VizorUI = function() {	// E2.ui
	var that = this;
	var fullscreen = false;
};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2);
	e2.app.onSignInClicked = this.openLoginModal;
	e2.app.onSearchResultsChange = this.onSearchResultsChange;
	e2.core.on('resize', this.onWindowResize.bind(this));
	e2.core.on('fullScreenChangeRequested', this.onFullScreenChangeRequested.bind(this));
}

VizorUI.prototype.onFullScreenChangeRequested = function() {	// placeholder
	this.fullscreen = this.isFullScreen();
	return true;
};

VizorUI.prototype.onWindowResize = function() {	// placeholder
	return true;
};

/***** IS... *****/

VizorUI.prototype.isFullScreen = function() {
	return !!(document.mozFullScreenElement || document.webkitFullscreenElement)
}

VizorUI.prototype.isModalOpen = function() {
	// return ($("body").data('bs.modal') || {}).isShown;
	return jQuery('div.bootbox.modal.in').length > 0;	// TODO: replace with a better query
}

/**** VARIOUS EVENT HANDLERS ****/

VizorUI.prototype.openLoginModal = function() {
	return E2.controllers.account.openLoginModal();
}

VizorUI.prototype.onSearchResultsChange = function() {
	var resultsCount = $('.result.table tbody').children().length;
	if (resultsCount>0) {
		E2.dom.presetsLib.removeClass('collapsed');
		E2.dom.presetsLib.find('.preset-list-container').show();
		var resultsHeight = $('.result.table').outerHeight(true);
		var maxHeight = 310;
		var newHeight = resultsHeight;
		newHeight = ( newHeight >= maxHeight ) ? (maxHeight) : (newHeight);
		E2.dom.presetsLib.height('auto');
		E2.dom.presetsLib.find('.preset-list-container').height(newHeight);
	}
	 else {
		E2.dom.presetsLib.addClass('collapsed');
		E2.dom.presetsLib.find('.preset-list-container').hide();
	}
}

VizorUI.prototype.openPresetSaveDialog = function(serializedGraph) {
	var that = this
	var username = E2.models.user.get('username')
	if (!username) {
		return E2.controllers.account.openLoginModal()
	}

	var presetsPath = '/'+username+'/presets/'

	E2.dom.load_spinner.show()

	$.get(presetsPath, function(files) {
		var fcs = new FileSelectControl()
		.frame('save-frame')
		.template('preset')
		.buttons({
			'Cancel': function() {
				E2.dom.load_spinner.hide()
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
						E2.dom.load_spinner.hide()
						that.presetManager.refresh()
					},
					error: function(x, t, err) {
						E2.dom.load_spinner.hide();

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