function AccountController(handlebars) {
	EventEmitter.call(this)

	this._handlebars = handlebars || window.Handlebars

	E2.models.user.on('change', this.renderLoginView.bind(this));
	
	this.renderLoginView(E2.models.user)
}

AccountController.prototype = Object.create(EventEmitter.prototype)

AccountController.prototype.renderLoginView = function(user) {
	var viewTemplate = E2.views.partials.userpulldown

	var html = viewTemplate({
		user: user.toJSON()
	})

	$('#account').html(html)

	E2.dom.userPullDown = $('#userPullDown')

	this._bindModalLinks(E2.dom.userPullDown)

	this.emit('redrawn')
}

AccountController.prototype.isValidEmail = function(email) {
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(email);
}

AccountController.prototype.showError = function(ertype, ertext) {
	$('#'+ertype+'-error span').html(ertext);
	$('#'+ertype+'-error').addClass('revealError');

	// @todo remove this validation code

	switch (true) {
		case (ertype === 'signin'): {
			$('#login-form_id .form-input').addClass('wrong');
			break;
		}
		case (ertype === 'email'): {
			$('#email_id').addClass('wrong');
			break;
		}
		case (ertype === 'username'): {
			$('#username_id').addClass('wrong');
			break;
		}
		case (ertype === 'password'): {
			$('#password_id').addClass('wrong');
			break;
		}
		case (ertype === 'confirm'): {
			$('#password_confirm_id').addClass('wrong');
			break;
		}
	}
}

AccountController.prototype.hideError = function(ertype) {
	if ($('#'+ertype+'-error').hasClass('revealError')) {
		$('#'+ertype+'-error').addClass('hideError')
							.removeClass('revealError');
		setTimeout(function() {
			$('#'+ertype+'-error').removeClass('hideError')
								.find('span')
								.html('');
		},1000)
	}
}

AccountController.prototype._bindModalLinks = function(el, dfd) {
	var that = this;

	$('a.login', el).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openLoginModal(dfd);
		return false;
	});
	
	$('a.signup', el).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openSignupModal(dfd);
		return false;
	});
	
	$('a.forgot', el).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openForgotPasswordModal(dfd);
		return false;
	});
	

	$('a.account', el).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openAccountModal(dfd);
		if (E2.dom.userPullDown.is(':visible'))
			E2.dom.userPullDown.hide();
		return false;
	});
}

AccountController.prototype.openLoginModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var loginTemplate = E2.views.account.login;

	ga('send', 'event', 'account', 'open', 'loginModal');

	var bb = VizorUI.modalOpen(loginTemplate(), 'Sign in', 'nopad login')
	this._bindModalLinks(bb, dfd);

	var onSuccess = function(user) {
		ga('send', 'event', 'account', 'loggedIn', user.username)
		E2.models.user.set(user);
		bootbox.hideAll();
		dfd.resolve()
	};

	var $form = $('#loginForm', bb);
	VizorUI.setupGenericAjaxForm($form, onSuccess);

	return dfd.promise
}

/**
 * adds handler to check whether desired username is available.
 * this is used in the signup and edit account details forms
 * @param $el jQuery
 */
AccountController.prototype.setupAccountUsernameField = function($el) {
	if (!($el instanceof jQuery)) {
		msg("ERROR: unrecognised $el");
		return false;
	}
	var _t = null;
	var lastValue=false;
	$el.on('keyup', function(e){
		var currentUsername = (E2.models.user) ? E2.models.user.username : '';
		var value = $el.val().trim();
		if (value && (value !== currentUsername) && (value !== lastValue)) {
			lastValue=value;
			if (_t) clearTimeout(_t);
			_t = setTimeout(function(){
				jQuery.ajax({		// backend responds with 409 or 200 here.
					type: "POST",
					url: '/account/exists',
					data: jQuery.param({'username': value}),
					error: function(err, msg) {
						// err.status = 409
						var errText = 'Sorry, this username is already taken'
						$el.parent().addClass('error').find('span.message').html(errText);
					},
					success: function(user) {
						if ($el.val() === value) {	//
							$el.parent().removeClass('error').find('span.message').html('');
						}
					},
					dataType: 'json'
				});
			}, 1000);	// every sec
		}
		return true;
	});


}

AccountController.prototype.openSignupModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var signupTemplate = E2.views.account.signup();
	ga('send', 'event', 'account', 'open', 'signupModal');

	var bb = VizorUI.modalOpen(signupTemplate, 'Sign up', 'nopad mSignup', true, {backdrop:null});

	that._bindModalLinks(bb, dfd);

	var $form = jQuery('#signupForm', bb);
	var $usernameField = jQuery('input#username_id', $form);
	var onSuccess = function(user) {
		ga('send', 'event', 'account', 'signedUp', user.username)
		E2.models.user.set(user);
		VizorUI.modalClose();
		dfd.resolve()
	};

	VizorUI.setupGenericAjaxForm($form, onSuccess);
	this.setupAccountUsernameField($usernameField);		// username check

	return dfd.promise;
}

AccountController.prototype.openForgotPasswordModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var forgotTemplate = E2.views.account.forgot;
	
	ga('send', 'event', 'account', 'open', 'forgotModal');
	
	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(forgotTemplate);
	});

	this._bindModalLinks(bb, dfd);
	
	var formEl = $('#forgot-form_id');
	formEl.submit(function( event )
	{
		event.preventDefault();
		
		if (!that.isValidEmail(formEl.find('#email_id').val())) {
			var errText = 'Whoops! This isn\'t a valid email address';
			that.showError('email',errText);
			return;
		}

		var formData = formEl.serialize();

		$.ajax(
		{
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err)
			{	
				var errText = 'Whoops! This email isn\'t registered'
				that.showError('general',errText);
			},
			success: function(user)
			{
				ga('send', 'event', 'account', 'passwordReset', user.username)
				bootbox.hideAll();
				bootbox.alert('Instructions have been sent. Please check your email.');
				dfd.resolve();
			},
			dataType: 'json'
		});
	});

	return dfd.promise
}

AccountController.prototype.openResetPasswordModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var resetTemplate = E2.views.account.reset;
	
	ga('send', 'event', 'account', 'open', 'resetModal');

	var bb = VizorUI.modalOpen(resetTemplate, 'Change Password', 'nopad');
	this._bindModalLinks(bb, dfd);
	
	var $form = jQuery('#resetPasswordForm', bb);
	var onSuccess = function(data) {
		var user = data.user;
		ga('send', 'event', 'account', 'passwordChanged', user.username)
		VizorUI.modalClose();
		bootbox.alert('Password for ' + user.username + ' was changed.');
		dfd.resolve();
	};
	VizorUI.setupGenericAjaxForm($form, onSuccess);

	return dfd.promise
}

AccountController.prototype.openAccountModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var accountTemplate = E2.views.account.account({user: E2.models.user.toJSON()});

	ga('send', 'event', 'account', 'open', 'accountModal');

	var bb = VizorUI.modalOpen(accountTemplate, 'Account', 'nopad', true)

	jQuery('a#changePasswordLink', bb).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openResetPasswordModal(dfd);
	});

	// #704
	/*
	jQuery('a#deleteAccountLink', bb).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
	});
	*/

	var onSuccess = function(data) {
		var user = data.user || null;
		if (user) E2.models.user.set(user);
		ga('send', 'event', 'account', 'accountUpdated', user.username)
		VizorUI.modalClose();
		bootbox.alert('Account updated!');
		dfd.resolve();
	};

	var $form = jQuery('#accountDetailsForm', bb);
	VizorUI.setupGenericAjaxForm($form, onSuccess);
	return dfd.promise
}

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
