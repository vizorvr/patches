// require ui-core.js


VizorUI.prototype.setupEventHandlers = function(e2, dom) {
	if (typeof e2 == 'undefined') return false;
	dom = dom || this.dom;
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2);

	// things that live elsewhere are called elsewhere
	dom.btnViewMode.click(e2.app.toggleWorldEditor.bind(e2.app));
	dom.btnGraph.click(e2.app.toggleNoodles.bind(e2.app));
	dom.btnAccountMenu.click(e2.app.onAccountMenuClicked.bind(e2.app));

	// elements under our control call us
	dom.btnSignIn.click(this.openLoginModal.bind(this));

	dom.chatTabBtn.click(this.onChatTabClicked.bind(this));
	dom.chatToggleButton.click(this.onChatToggleClicked.bind(this));
	dom.chatClose.click(this.onChatCloseClicked.bind(this));
	dom.peopleTabBtn.click(this.onChatPeopleTabClicked.bind(this));
	dom.btnChatDisplay.click(this.onChatDisplayClicked.bind(this));

	dom.btnAssets.click(this.onBtnAssetsClicked.bind(this));
	dom.assetsClose.click(this.onAssetsCloseClicked.bind(this));
	dom.assetsToggle.click(this.onAssetsToggleClicked.bind(this));

	dom.btnPresets.click(this.onBtnPresetsClicked.bind(this));
	dom.presetsClose.click(this.onPresetsCloseClicked.bind(this));
	dom.presetsToggle.click(this.onPresetsToggleClicked.bind(this));
	dom.btnInspector.click(this.onInspectorClicked.bind(this));
};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	this._init(e2);
	this.setupEventHandlers(e2,this.dom);

	var dom = this.dom;
	dom.presetsLib.movable();
	dom.assetsLib.movable();

	var chatTop = $(window).height() - $('.chat-users').height() - $('.bottom-panel').height() - 40;
	if (chatTop<($('.editor-header').height()+$('#breadcrumb').height())) {
		chatTop= $('.editor-header').height() + $('#breadcrumb').height() + 40;
	}
	dom.chatWindow.css({'top': chatTop});
	dom.chatWindow.movable();

	e2.app.onWindowResize();
	this.setWorldEditorMode(e2.app.worldEditor.isActive());
}



/***** LOADING *****/
VizorUI.prototype.setLoadingStatus = function(is_loading) {}
VizorUI.prototype.hideLoadingIndicator = function() {
	this.updateProgressBar(100);
}
VizorUI.prototype.showLoadingIndicator = function() {
	this.updateProgressBar(10);
}

/***** MODAL DIALOGS/WINDOWS *****/
// stubs
// VizorUI.prototype.openModal
// VizorUI.prototype.closeModal

VizorUI.prototype.openLoginModal = function() {
	return E2.controllers.account.openLoginModal();
}


VizorUI.prototype.onSearchResultsChange = function() {
  var presetsLib = E2.dom.presetsLib;
  var resultsCount = $('.result.table tbody').children().length;  
	var presetsList = presetsLib.find('.preset-list-container');
	var maxHeight = presetsList.css('maxHeight');
	if (resultsCount>0) {
		presetsLib.removeClass('collapsed');
		presetsList.show();
		var resultsHeight = $('.result.table').outerHeight(true);
		var newHeight = resultsHeight;
		newHeight = ( newHeight >= maxHeight ) ? (maxHeight) : (newHeight);
		presetsLib.height('auto');
		presetsList.height(newHeight);
	}
	 else {
		presetsLib.height('auto');
		presetsList.height(maxHeight);
	}
};

VizorUI.prototype.openPublishGraphModal = function() {
	var that = this;
	var publishTemplate = E2.views.filebrowser.publishModal;
	var graphname = E2.app.path.split('/')
   
   if (graphname.length > 1)
        graphname=p[1];
	
	ga('send', 'event', 'account', 'open', 'forgotModal');
	
	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(publishTemplate);
		$('#userGraphName_id').val(graphname);
	});

	this._bindEvents(bb, dfd);
	
	var formEl = $('#publish-form_id');
	formEl.submit(function( event )
	{
		event.preventDefault();
		E2.ui.updateProgressBar(65);
		
		var path = $('#userGraphName_id').val();

		
		if (!path)
			return bootbox.alert('Please enter a graph name');

		var ser = E2.app.player.core.serialise();

		$.ajax({
			type: 'POST',
			url: URL_GRAPHS,
			data: {
				path: path,
				graph: ser
			},
			dataType: 'json',
			success: function(saved) {
				E2.ui.updateProgressBar(100);
				ga('send', 'event', 'graph', 'saved')
				dfd.resolve(saved.path)
			},
			error: function(x, t, err) {
				E2.ui.updateProgressBar(100);

				if (x.status === 401) {
					return dfd.resolve(
						E2.controllers.account.openLoginModal()
							.then(that.openPublishGraphModal.bind(that))
					)
				}

				if (x.responseText)
					bootbox.alert('Publish failed: ' + x.responseText);
				else
					bootbox.alert('Publish failed: ' + err);

				dfd.reject(err)
			}
		})
	});

	return dfd.promise
}

VizorUI.prototype.onBtnPresetsClicked = function() {
	if (this.isVisible())
		this.dom.presetsLib.toggle().toggleClass('uiopen');
	this.syncVisibility();
}

VizorUI.prototype.onBtnAssetsClicked = function() {
	if (this.isVisible())
		this.dom.assetsLib.toggle().toggleClass('uiopen');
	this.syncVisibility();
}



VizorUI.prototype.onChatResize = function() {
	var dom = this.dom;
	var restHeight = dom.chatWindow.find('.drag-handle').height()
				   + dom.chatTabs.height()
				   + dom.chat.find('.chat-nav').outerHeight(true)
				   + dom.chat.find('.composer').outerHeight(true);
	var newHeight = dom.chatWindow.height() - restHeight;
	dom.chat.height('auto').find('.messages').height(newHeight);
};


VizorUI.prototype.onChatCloseClicked = function() {
	this.dom.chatWindow.removeClass('uiopen').hide();
	this.syncVisibility();
	return false;
}

VizorUI.prototype.onAssetsCloseClicked = function() {
	this.dom.assetsLib.removeClass('uiopen').hide();
	this.syncVisibility();
	return false;
}


VizorUI.prototype.onPresetsToggleClicked = function() {
	var dom = this.dom;
	var controlsHeight = dom.presetsLib.find('.drag-handle').outerHeight(true)
					   + dom.presetsLib.find('.block-header').outerHeight(true)
					   + dom.presetsLib.find('.searchbox').outerHeight(true);
	if (dom.presetsLib.hasClass('collapsed')) {
		dom.presetsLib.removeClass('collapsed');
		this.onSearchResultsChange();
	} else {
		dom.presetsLib.addClass('collapsed').height(controlsHeight);
	}
	return false;
}


VizorUI.prototype.onPresetsCloseClicked = function() {
	this.dom.presetsLib.removeClass('uiopen').hide();
	this.syncVisibility();
	return false;
}

VizorUI.prototype.onChatTabClicked = function() {
	var dom = this.dom;
	if (!$(this).parent().hasClass('active')) {
		dom.peopleTab.hide();
		dom.chatTab.show();
		dom.chatWindow.find('.resize-handle').show();
		dom.chatWindow.height('auto');
		this.onChatResize();
	}
	if (dom.chatWindow.hasClass('collapsed')) {
		dom.chatWindow.removeClass('collapsed')
	}
	return true;
};

VizorUI.prototype.onChatPeopleTabClicked = function() {
	var dom = this.dom;
	if (!$(this).parent().hasClass('active')) {
		dom.chatTab.hide();
		dom.chatWindow.find('.resize-handle').hide();
		dom.peopleTab.show();
		this.onPeopleListChanged(null);
	}
	if (dom.chatWindow.hasClass('collapsed')) {
		dom.chatWindow.removeClass('collapsed');
		this.onPeopleListChanged(null);
	}
	return true;
};


VizorUI.prototype.onChatDisplayClicked = function() {
	var isUiVisible = this.isVisible();
	var dom = this.dom;
	if (!dom.chatWindow.hasClass('collapsed')) {
		if (isUiVisible)
			dom.chatWindow.toggle();
		dom.chatWindow.toggleClass('uiopen');
		if (dom.peopleTab.hasClass('active') && dom.chatWindow.hasClass('active') && isUiVisible) {
			this.onPeopleListChanged(null);
		}
	}
	else {
		if (dom.peopleTab.hasClass('active')) {
			dom.chatWindow.removeClass('collapsed').show();
			this.onPeopleListChanged(null);
		} else {
			dom.chatWindow.removeClass('collapsed').show()
							 .height(dom.chatTabs.height + dom.chat.height)
		}
	}
	this.syncVisibility();
}

VizorUI.prototype.onPeopleListChanged = function(storeAction) {
	var dom = this.dom;
	if (dom.chatWindow.is(':visible') && !dom.chatWindow.hasClass('collapsed') && dom.peopleTab.is(':visible')) {
		var itemHeight = $('.graph-users>li:first-child').outerHeight(true);
		var visibleItems = 3;
		var listChange = 0;
		var $peopleScroll = $('.people-scroll');
		var $peopleList = $('.peopleList');
		if (storeAction==='added') {
			listChange = 1;
		} else if (storeAction==='removed') {
			listChange = -1;
		}
		if ($('.graph-users>li').length + listChange <= visibleItems) {
			dom.chatWindow.height(dom.chatWindow.find('.drag-handle').height()
								   + dom.chatTabs.height()
								   + $peopleList.find('.meta').outerHeight(true)
								   + itemHeight * ($('.graph-users>li').length
								   + listChange));
			$peopleScroll.height($('.chat-users').height()
									 - $('.chat-tabs').height());
			$peopleList.height($peopleScroll.height());
		} else {
			dom.chatWindow.height(dom.chatWindow.find('.drag-handle').height()
								   + dom.chatTabs.height()
								   + $peopleList.find('.meta').outerHeight(true)
								   + itemHeight * visibleItems);
			$peopleScroll.height($('.chat-users').height()
									 - $('.chat-tabs').height());
			$peopleList.height($peopleScroll.height());
		}
	}
}


VizorUI.prototype.onChatToggleClicked = function() {
	var dom = this.dom;
	if (dom.chatWindow.hasClass('collapsed')) {
		if (dom.peopleTab.hasClass('active')) {
			dom.chatWindow.removeClass('collapsed');
			this.onPeopleListChanged(null);
		} else {
			dom.chatWindow.removeClass('collapsed')
							 .height(dom.chatWindow.find('.drag-handle').height()
								   + dom.chatTabs.height()
								   + dom.chat.height());
		}
	} else {
		dom.chatWindow.addClass('collapsed')
						 .height(dom.chatWindow.find('.drag-handle').height()
							   + dom.chatTabs.height());
	}
	return false;
};

VizorUI.prototype.onAssetsToggleClicked = function() {
	var dom = this.dom;
	var controlsHeight = dom.assetsLib.find('.drag-handle').outerHeight(true)
					   + dom.assetsLib.find('.block-header').outerHeight(true)
					   + dom.assetsLib.find('.searchbox').outerHeight(true);
	if (E2.dom.assetsLib.hasClass('collapsed')) {
		var newHeight = controlsHeight
					   + dom.assetsLib.find('#assets-tabs').outerHeight(true)
					   + dom.assetsLib.find('.tab-content.active .assets-frame').outerHeight(true)
					   + dom.assetsLib.find('.load-buttons').outerHeight(true)
					   + dom.assetsLib.find('#asset-info').outerHeight(true)
		dom.assetsLib.removeClass('collapsed').height(newHeight);
	} else {
		dom.assetsLib.addClass('collapsed').height(controlsHeight);
	}
	return false;
};


VizorUI.prototype.onInspectorClicked = function() {
	var app = E2.app;
	if (app.selectedNodes.length===1) {
		if (app.selectedNodes[0].ui.hasPreferences()) {
			app.selectedNodes[0].ui.openInspector();
		} else {
			app.growl('This node has no settings.','info',4000);
		}
	} else {
		app.growl('Select one particular patch to see its settings.','info',4000);
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

VizorUI.prototype.setWorldEditorMode = function(is_active) {
	is_active = !!is_active;	// force bool
	if (is_active)
		this.viewmode = uiViewMode.world_editor;
	else
		this.viewmode = uiViewMode.patch_editor;
};


VizorUI.prototype.toggleFullscreenVRViewButtons = function() {
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
	var dom = this.dom;
	percent = 0.0 + percent;
	if (percent > 100) percent = 100;
	if (percent < 0) percent = 0;
	dom.progressBar = $('#progressbar');
	
	if (!dom.progressBar.is(':visible'))
		dom.progressBar.show().width(1);
	
	var winWidth = $(window).width();
	var barWidth = dom.progressBar.width();
	var newWidth = winWidth / 100 * percent;
	var barSpace = winWidth - barWidth;
	var barSpeed = 2000 - percent * 12;
	
	percent = (percent === 0) ? (barWidth / newWidth + 5) : (percent);
	newWidth = (newWidth <= barWidth) ? (barSpace / 100 * percent + barWidth) : (newWidth);
	
	dom.progressBar.stop().animate({width: newWidth}, {duration: barSpeed, easing: 'linear', complete: function() {
		if ($(this).width() === winWidth)
			$(this).fadeOut('slow');
	}});
}
