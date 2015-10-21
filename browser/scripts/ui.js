// require ui-core.js

VizorUI.prototype.setupEventHandlers = function(e2, dom) {
	if (typeof e2 === 'undefined') return false;
	dom = dom || this.dom;
	e2.app.openPresetSaveDialog = this.openPresetSaveDialog.bind(e2.app);

	this.on(uiEvent.worldEditChanged, function(isActive){	// this = ui
		this.state.viewCamera = (isActive) ? uiViewCam.world_editor : uiViewCam.vr;
		this.applyVisibility()
	}.bind(this));
	dom.btnGraph.click(e2.app.toggleNoodles.bind(e2.app));

	e2.controllers.account.on('redrawn', function() {
		dom.btnAccountMenu = $('.btn-account-top');
		dom.btnAccountMenu.click(this.toggleAccountDropdown.bind(this));
	}.bind(this));
	dom.btnAccountMenu.click(this.toggleAccountDropdown.bind(this));

	// menu shell
	dom.btnSignIn.click(this.openLoginModal.bind(this));
	dom.btnAssets.click(this.onBtnAssetsClicked.bind(this));
	dom.btnPresets.click(this.onBtnPresetsClicked.bind(this));
	dom.btnChatDisplay.click(this.onChatDisplayClicked.bind(this));
	dom.btnInspector.click(this.onInspectorClicked.bind(this));
	dom.btnEditorCam.click(this.enterEditorView.bind(this));

	dom.btnVRCam.click(this.enterVRView.bind(this));
	dom.chatToggleButton.click(this.onChatToggleClicked.bind(this));
	dom.chatClose.click(this.onChatCloseClicked.bind(this));
	dom.chatTabBtn.click(this.onChatTabClicked.bind(this));
	dom.peopleTabBtn.click(this.onChatPeopleTabClicked.bind(this));

	dom.assetsClose.click(this.onAssetsCloseClicked.bind(this));
	dom.assetsToggle.click(this.onAssetsToggleClicked.bind(this));

	dom.presetsClose.click(this.onPresetsCloseClicked.bind(this));
	dom.presetsToggle.click(this.onPresetsToggleClicked.bind(this));

	var $presetsLibItems = jQuery('div#presets-lib ul li');
	$presetsLibItems.last().find('a').click(this.onTreeClicked.bind(this));
	$presetsLibItems.first().find('a').click(this.updateState.bind(this));

	$(document).on("shown.bs.modal", function() {
		$('.bootbox-close-button').html('<svg class="icon-dialog-close">'
									  + '<use xlink:href="#icon-close"></use></svg>')
								  .attr('style','opacity:1');
	});
};

VizorUI.prototype.init = function(e2) {	// normally the global E2 object
	e2.app.onWindowResize();
	this.setWorldEditorMode(this.state.viewCamera === uiViewCam.world_editor);

	this._init(e2);
	this.setupEventHandlers(e2,this.dom);

	var dom = this.dom;
	dom.presetsLib.movable();
	dom.assetsLib.movable();

	var chatUsersHeight = jQuery('.chat-users').height();

	var bottomPanelHeight = jQuery('.bottom-panel').height();
	var editorHeaderHeight = jQuery('.editor-header').height();
	var breadcrumbHeight = jQuery('#breadcrumb').height();
	var chatTop = $(window).height() - chatUsersHeight - bottomPanelHeight - 40;

	if (chatTop < (editorHeaderHeight + breadcrumbHeight)) {
		chatTop = breadcrumbHeight + breadcrumbHeight + 40;
	}
	dom.chatWindow.css({'top': chatTop});
	dom.chatWindow.movable();

	this.setPageTitle();

	dom.assetsLib.on(uiEvent.moved, this.updateState.bind(this));
	dom.chatWindow.on(uiEvent.moved, this.updateState.bind(this));
	dom.presetsLib.on(uiEvent.moved, this.updateState.bind(this));

	this._initialised = true;

	this.emit(uiEvent.initialised, this);
}



/***** LOADING *****/
VizorUI.prototype.setLoadingStatus = function(is_loading) {}
VizorUI.prototype.hideLoadingIndicator = function() {
	this.updateProgressBar(100);
}
VizorUI.prototype.showLoadingIndicator = function() {
	this.updateProgressBar(10);
}

VizorUI.prototype.setPageTitle = function() {
	var isLoggedIn = E2.models.user.get('username');
	if (!isLoggedIn)
		return false;

	var graphname = E2.app.path;
	var newTitle = "Vizor";

	graphname = graphname.split('/')
	if (graphname.length > 1)
		graphname=graphname[1];
	
	newTitle = graphname + " | " + newTitle;	
	document.title = newTitle;
	return newTitle;
}

VizorUI.prototype.toggleAccountDropdown = function() {	//
	var username = E2.models.user.get('username')
	if (username) {
		this.dom.userPullDown.toggle();
	}
	return false;
}

/***** MODAL DIALOGS/WINDOWS *****/

VizorUI.prototype.openLoginModal = function() {
	return E2.controllers.account.openLoginModal();
}

VizorUI.prototype.openSignupModal = function() {
	return E2.controllers.account.openSignupModal();
}

VizorUI.prototype.openPublishGraphModal = function() {
	var dfd = when.defer()
	var that = this;
	var publishTemplate = E2.views.filebrowser.publishModal;
	var graphname = E2.app.path.split('/')
    if (graphname.length > 1)
        graphname = graphname[1];

	var graphdata = E2.app.player.core.serialise();
	var data = {
		path:	graphname,
		graph:	graphdata
	};

	var openSaveGraph = function(dfd) {
		ga('send', 'event', 'account', 'open', 'publishGraphModal');
		var $modal = VizorUI.modalOpen(publishTemplate(data), 'Publish this scene', 'nopad');
		var $form = $('#publishGraphForm', $modal);
		VizorUI.setupXHRForm($form, function(saved){
			ga('send', 'event', 'graph', 'saved')
			dfd.resolve(saved.path);
		});
	}

	if (!VizorUI.userIsLoggedIn()) {
		E2.controllers.account.openLoginModal()
			.then(openSaveGraph);
	} else {
		openSaveGraph(dfd);
	}

	return dfd.promise
}

/***** EVENT HANDLERS *****/

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
	this.updateState();
};

VizorUI.prototype.onBtnPresetsClicked = function() {
	if (!this.isVisible()) return false;
	this.state.visibility.panel_presets = !this.state.visibility.panel_presets;
	this.applyVisibility();
	return false;
}

VizorUI.prototype.onBtnAssetsClicked = function() {
	if (!this.isVisible()) return false;
	this.state.visibility.panel_assets = !this.state.visibility.panel_assets;
	this.applyVisibility();
	return false;
}

VizorUI.prototype.enterEditorView = function() {
	if ((this.state.viewCamera === uiViewCam.world_editor) && E2.app.worldEditor.isActive()) return false;
	E2.app.toggleWorldEditor(true);
	return false;
}
VizorUI.prototype.enterVRView = function() {
	if ((this.state.viewCamera === uiViewCam.vr) && !E2.app.worldEditor.isActive()) return false;
	E2.app.toggleWorldEditor(false);
	return false;
}

VizorUI.prototype.onChatResize = function() {
	var dom = this.dom;
	var $chatPanel = dom.chatWindow;
	var $chat = dom.chat;

	var panelHeight = $chatPanel.outerHeight(true);
	if (panelHeight < 120) {
		panelHeight = 120;
		$chatPanel.height(panelHeight);
	}
	var chatParentHeight = $chatPanel.parent().height();
	if (panelHeight > chatParentHeight) {
		$chatPanel.height(chatParentHeight - 10);
	}

	var restHeight = $chatPanel.find('.drag-handle').height()
	restHeight += dom.chatTabs.height();
	restHeight += $chat.find('.chat-nav').outerHeight(true);
	restHeight += $chat.find('.composer').outerHeight(true);

	var newHeight = panelHeight - restHeight - 2;
	$chat.height('auto').find('.messages').height(newHeight);
};


VizorUI.prototype.onChatCloseClicked = function() {
	this.state.visibility.panel_chat = false;
	this.applyVisibility();
	return false;
}

VizorUI.prototype.onAssetsCloseClicked = function() {
	this.state.visibility.panel_assets = false;
	this.applyVisibility();
	return false;
}

VizorUI.prototype.onPresetsCloseClicked = function() {
	this.state.visibility.panel_presets = false;
	this.applyVisibility();
	return false;
}

VizorUI.prototype.onTreeClicked = function(e) {
	this.dom.presetsLib.removeClass('collapsed').height('auto');
	this.updateState();
	return true;
}

VizorUI.prototype.onPresetsToggleClicked = function(e) {	// this = ui
	var dom = this.dom;

	var $graphTab = jQuery('div#graph.tab-pane');
	if ($graphTab.hasClass('active')) {	// we're looking at the graph Tab, which shouldn't collapse
		dom.presetsLib.removeClass('collapsed').height('auto');
		this.updateState();
		return true;
	}
	// else
	var controlsHeight = dom.presetsLib.find('.drag-handle').outerHeight(true)
					   + dom.presetsLib.find('.block-header').outerHeight(true)
					   + dom.presetsLib.find('.searchbox').outerHeight(true);
	if (dom.presetsLib.hasClass('collapsed')) {
		dom.presetsLib.removeClass('collapsed');
		this.onSearchResultsChange();
	} else {
		// should collapse
		dom.presetsLib.addClass('collapsed').height(controlsHeight);
	}
	this.updateState();
	return false;
}

VizorUI.prototype.onLibSearchClicked = function(e) {
	var $input = jQuery(e.target);
	var currentLib = $input.parents('.vp-library');
	if (currentLib.hasClass('collapsed')) {
		currentLib.removeClass('collapsed')
		this.onSearchResultsChange();
	}
	this.updateState();
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
	this.updateState();
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
	this.updateState();
	return true;
};


VizorUI.prototype.onChatDisplayClicked = function() {
	var isUiVisible = this.isVisible();
	if (!isUiVisible) return false;

	this.state.visibility.panel_chat = !this.state.visibility.panel_chat;
	this.applyVisibility(false);	// do not update state just yet

	var dom = this.dom;
	if (!dom.chatWindow.hasClass('collapsed')) {
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
	this.updateState();
	return false;
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
								   + itemHeight * ($('.graph-users>li').length + listChange));
			$peopleScroll.height($('.chat-users').height() - $('.chat-tabs').height());
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


VizorUI.prototype.onChatToggleClicked = function() {	// this = ui
	var dom = this.dom;
	var $chatWindow = dom.chatWindow;
	var dragHandleHeight = $chatWindow.find('.drag-handle').height();
	var chatTabHeight = dom.chatTabs.height();
	if ($chatWindow.hasClass('collapsed')) {
		$chatWindow.removeClass('collapsed');
		if (dom.peopleTab.hasClass('active')) {
			this.onPeopleListChanged(null);
		} else {
			$chatWindow.height(dragHandleHeight + chatTabHeight + dom.chat.height());
		}
	} else {
		$chatWindow.addClass('collapsed');
		$chatWindow.height(dragHandleHeight + chatTabHeight);
	}
	this.updateState();
	return false;
};

VizorUI.prototype.onAssetsToggleClicked = function() {	// this = ui
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
	this.updateState();
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
	this.updateState();
	return true;
}


VizorUI.prototype.openPresetSaveDialog = function(serializedGraph) {

	var that = this;	// e2.app
	var ui = E2.ui;

	var presetDialog = function() {

		var username = E2.models.user.get('username');
		var presetsPath = '/'+username+'/presets/'

		ui.updateProgressBar(65);

		$.get(presetsPath, function(files) {
			var fcs = new FileSelectControl()
			.frame('save-frame')
			.template('preset')
			.buttons({
				'Cancel': function() {
					ui.updateProgressBar(100);
				},
				'Save': function(name) {
					if (!name)
					{
						bootbox.alert('Please enter a name for the preset')
						return false;
					}

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
							ui.updateProgressBar(100);
							that.presetManager.refresh()
						},
						error: function(x, t, err) {
							ui.updateProgressBar(100);

							// since we ask first thing above
							// if (x.status === 401)
							//	return E2.controllers.account.openLoginModal();

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

	if (!VizorUI.userIsLoggedIn()) {
		return ui.openLoginModal().then(presetDialog);
	}

	return presetDialog();

};

VizorUI.prototype.setWorldEditorMode = function(isActive) {
	return E2.app.toggleWorldEditor(isActive);	// E2.app will emit an event back at us
};


VizorUI.prototype.toggleFullscreenVRViewButtons = function() {
	var vr = false; // place E2 VR device check here;
	E2.dom.fscreen.parent.toggle(!vr);
	E2.dom.vrview.parent.toggle(vr);
}


/***** MISC UI MODALS/DIALOGS *****/

VizorUI.prototype.viewSource = function() {
	var b = bootbox.dialog({
		message: '<h3 style="margin-top:0;padding-top:0;">source</h3><textarea spellcheck="false" autocorrect="false" readonly="true" class="form-control" cols="80" rows="40">'+
			E2.core.serialise()+'</textarea>',
		buttons: { 'OK': function() {} }
	});
	jQuery(b).addClass('wideauto').addClass('viewsource');
};

VizorUI.prototype.showFirstTimeDialog = function() {
	if (!E2.util.isFirstTime())
		return;

	var that = this;

	Cookies.set('vizor100', { seen: 1 }, { expires: Number.MAX_SAFE_INTEGER })

	var welcomeModal = VizorUI.modalOpen(
		E2.views.account.firsttime({user:E2.models.user.toJSON()}),
		null,
		'nopad welcome'
	);
	welcomeModal.find('a.login').on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openLoginModal();
		return false;
	});
	welcomeModal.find('a.signup').on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openSignupModal();
		return false;
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




/***** HELPER METHODS *****/

VizorUI.userIsLoggedIn = function() {
	var user = E2.models.user.toJSON();
	return (typeof user.username !== 'undefined') && (user.username !== '');
}


/***** INTERIM MODAL LAYER *****/
VizorUI.modalOpen = function(html, heading, className, allowclose, opts) {
	allowclose = (typeof allowclose !== 'undefined') ? !!allowclose : true;
	opts = opts || {}
	opts.message = html;
	opts.onEscape = allowclose;
	if (typeof opts.backdrop === 'udefined') opts.backdrop = allowclose;	// bb 4.4+
	if ((typeof heading !== 'undefined') && heading) opts.title = heading;
	if ((typeof className !== 'undefined') && className) opts.className = className;
	return bootbox.dialog(opts);
};

VizorUI.modalClose = function() {
	bootbox.hideAll();
};

// shorthand
VizorUI.modalAlert = function(message, heading, className, okLabel) {
	var opts = {
		buttons: {
			OK : {
				label: okLabel || "OK",
				callback: function(){}
			}
		}
	}
	return VizorUI.modalOpen('<p>'+message+'</p>', heading, className, true, opts);
}

VizorUI.checkCompatibleBrowser = function() {
	var agent = navigator.userAgent;
	var heading=false,message=false;
	if ((/Chrome/i.test(agent)) || (/Firefox/i.test(agent))) {

	}
	else if (E2.util.isMobile()) {
		heading = 'Mobile support';
		message = '<h4>Please view this page on your desktop/laptop. '+
					 'The editor is not ready for mobile just yet.</h4>';
	}
	else {
		heading = 'Browser support';
		message = '<h4>We want you to fully enjoy Vizor. <br />The editor works best in '+
					 '<a href="http://www.google.com/chrome/" target="_blank"'+
					 ' alt="Get Chrome">Chrome</a> or '+
					 '<a href="http://www.mozilla.org/firefox/new/" target="_blank"'+
					 ' alt="Get Firefox">Firefox</a>.</h4>';

	}
	if (message) VizorUI.modalOpen(message, heading, 'note', true, {buttons: { Ok: function() {}}});
}


VizorUI.setupXHRForm = function($form, onSuccess) {	// see views/account/signup for example
	if (!($form instanceof jQuery)) {
		msg("ERROR: $form not a jQuery object")
		return false;
	}

	$form.find('input, textarea').each(function(){
		var $this = jQuery(this);
		var placeholder = $this.attr('placeholder');
		var required = $this.hasClass('required');
		var had_error = false;
		var had_error_value = false;
		if (placeholder) {
			if (required) placeholder += '*';
			$this.attr('placeholder', placeholder);
			$this.on('focus', function(){
				had_error = $this.parent().hasClass('error');
				had_error_value = (had_error) ? $this.val() : false;
				$this.parent().removeClass('error').find('span.message').html('');
				$this.addClass('in_focus');
				// ux
				//	$this.data('placeholder', placeholder);
				//	$this.attr('placeholder', '');
				return true;
			});

			$this.on('blur', function(){
				// ux
				//	$this.attr('placeholder', $this.data('placeholder'));
				$this.removeClass('in_focus');
				if (required && had_error &&
					(($this.val() === '') || ($this.val() === had_error_value))
					) $this.parent().addClass('error');
				return true;
			});
		}
	});

	var inProgress = false;
	var $body = jQuery(document.body);

	$form.submit(function(event) {

		if (inProgress) return false;

		// if (!can_submit) return false;

		// future decision on forms without this set
		var actionURL = $form.attr('action');
		if (!actionURL) return true;

		event.preventDefault();
		var formData = $form.serialize();

		$form.find('span.message').html('');
		$form.find('div.form-input').removeClass('error');

		var $unknownError = jQuery('#unknown_error', $form);
		$unknownError.html('').hide();
		inProgress = true;
		$body.addClass('loading');
		jQuery.ajax({
			type:	'POST',
			url:	actionURL,
			data:	formData,
			dataType: 'json',
			error: function(err) {
				inProgress = false;
				$body.removeClass('loading');
				console.log(err);
				if (err.responseJSON) {
					var errors
					// validation returns array, but simple responses only have message
					if (err.responseJSON instanceof Array) {
						errors = err.responseJSON;
					}
					else if (err.responseJSON.error && err.responseJSON.error.errors){	// graphController
						errors = [];
						var ers = err.responseJSON.error.errors;
						for (var key in ers) {
							if (ers.hasOwnProperty(key)) {
								errors.push({
									param: key,
									msg: ers[key].message
								});
							}
						}
					}
					else {
						errors = [{
							param:	err.responseJSON.param || '',
							msg:	err.responseJSON.message
						}];
					}
					errors.map(function(ei) {
						var $field = $form.find('#f_'+ei.param);
						if (ei.param && ei.msg && ($field.length>0)) {
							$field.addClass('error')
								.find('span.message').html(ei.msg)
						} else {
							// in case no 'param' comes back
							$unknownError.html($unknownError.html() + '<span>'+ (ei.msg || ei.message) + '</span>').show();
						}
					});
				} else {
					if (err.status === 200) {	// the response was deemed an error but has good status
						$unknownError.html('<span>The server said: (' + err.status + '): ' + err.statusText +'</span>').show();
					} else {
						// in case no responseJSON comes back, e.g. just a code
						$unknownError.html('<span>An error ('+err.status+') occurred. Please check all required fields</span>').show();
					}
				}
			},
			success: function() {
				inProgress = false;
				$body.removeClass('loading');
				onSuccess.apply(this,arguments);
			}

		});
		return false;
	});
}