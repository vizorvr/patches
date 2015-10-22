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
	dfd = dfd || when.defer();
	var loginTemplate = E2.views.account.login;

	ga('send', 'event', 'account', 'open', 'loginModal');

	var $modal = VizorUI.modalOpen(loginTemplate(), 'Sign in', 'nopad login');
	this._bindModalLinks($modal, dfd);

	var onSuccess = function(user) {
		ga('send', 'event', 'account', 'loggedIn', user.username)
		E2.models.user.set(user);
		bootbox.hideAll();
		dfd.resolve()
	};

	var $form = $('#loginForm', $modal);
	VizorUI.setupXHRForm($form, onSuccess);

	return dfd.promise
}

/**
 * adds handler to check whether desired username is available.
 * this is used in the signup form, and may be used in the account details form
 * @param $input jQuery
 */
AccountController.prototype._setupAccountUsernameField = function($input) {
	if (!($input instanceof jQuery)) {
		msg("ERROR: unrecognised $input");
		return false;
	}
	var _t = null;
	var lastValue=false;
	$input.on('keyup', function(e){
		var currentUsername = (E2.models.user) ? E2.models.user.username : '';
		var value = $input.val().trim();
		if (value && (value !== currentUsername) && (value !== lastValue)) {
			lastValue=value;
			if (_t) clearTimeout(_t);
			_t = setTimeout(function(){
				jQuery.ajax({		// backend responds with 409 or 200 here.
					type: "POST",
					url: '/account/exists',
					data: jQuery.param({'username': value}),
					error: function(err) { // assume 409
						var errText = 'Sorry, this username is already taken'
						$input.parent().addClass('error').find('span.message').html(errText);
					},
					success: function() {	// 200
						if ($input.val() === value) {	//
							$input.parent().removeClass('error').find('span.message').html('');
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

	var $modal = VizorUI.modalOpen(signupTemplate, 'Sign up', 'nopad mSignup', true, {backdrop:null});

	that._bindModalLinks($modal, dfd);

	var $form = jQuery('#signupForm', $modal);
	var $usernameField = jQuery('input#username_id', $form);
	var onSuccess = function(user) {
		ga('send', 'event', 'account', 'signedUp', user.username)
		E2.models.user.set(user);
		VizorUI.modalClose();
		VizorUI.modalAlert('Enjoy Vizor, ' + user.username + '!', 'Welcome')
		dfd.resolve()
	};

	VizorUI.setupXHRForm($form, onSuccess);
	this._setupAccountUsernameField($usernameField);		// username check

	return dfd.promise;
}

AccountController.prototype.openForgotPasswordModal = function(dfd) {
	dfd = dfd || when.defer();
	var forgotTemplate = E2.views.account.forgot;
	
	ga('send', 'event', 'account', 'open', 'forgotModal');

	var $modal = VizorUI.modalOpen(forgotTemplate(), 'Forgot password', 'nopad mForgotpassword');
	this._bindModalLinks($modal, dfd);
	var $form = $('#forgotPasswordForm');
	VizorUI.setupXHRForm($form, function(response){
		VizorUI.modalClose();
		if (response.ok) {
			ga('send', 'event', 'account', 'passwordReset', response.email)
			VizorUI.modalAlert(response.message, 'Done');
		}
		dfd.resolve();
	});
	return dfd.promise;
}

AccountController.prototype.openResetPasswordModal = function(dfd) {
	dfd = dfd || when.defer();
	var resetTemplate = E2.views.account.reset;
	
	ga('send', 'event', 'account', 'open', 'resetModal');

	var $modal = VizorUI.modalOpen(resetTemplate, 'Change Password', 'nopad');
	this._bindModalLinks($modal, dfd);
	
	var $form = jQuery('#resetPasswordForm', $modal);
	var onSuccess = function(data) {
		var user = data.user;
		VizorUI.modalClose();
		ga('send', 'event', 'account', 'passwordChanged', user.username)
		VizorUI.modalAlert('Password for ' + user.username + ' was changed.', 'Done');
		dfd.resolve();
	};
	VizorUI.setupXHRForm($form, onSuccess);

	return dfd.promise
}

AccountController.prototype.openAccountModal = function(dfd) {
	var that = this;
	dfd = dfd || when.defer();
	var accountTemplate = E2.views.account.account({user: E2.models.user.toJSON()});

	ga('send', 'event', 'account', 'open', 'accountModal');

	var $modal = VizorUI.modalOpen(accountTemplate, 'Account', 'nopad', true)

	jQuery('a#changePasswordLink', $modal).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openResetPasswordModal(dfd);
	});

	// #704
	/*
	jQuery('a#deleteAccountLink', $modal).on('click', function(evt) {
		evt.preventDefault();
		// ...
	});
	*/

	var onSuccess = function(data) {
		var user = data.user || null;
		E2.models.user.set(user);
		ga('send', 'event', 'account', 'accountUpdated', user.username);
		VizorUI.modalClose();
		VizorUI.modalAlert(data.message, 'Done');
		dfd.resolve();
	};

	var $form = jQuery('#accountDetailsForm', $modal);
	VizorUI.setupXHRForm($form, onSuccess);
	return dfd.promise
}

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
