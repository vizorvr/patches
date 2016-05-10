function AccountController(handlebars) {
	EventEmitter.call(this)

	this.dom = {
		container : jQuery('#account')
	};

	this._handlebars = handlebars || window.Handlebars;
	E2.models.user.on('change', this.renderLoginView.bind(this));

	this.renderLoginView(E2.models.user)
}

AccountController.prototype = Object.create(EventEmitter.prototype)

AccountController.prototype.renderLoginView = function(user) {
	var viewTemplate = E2.views.partials.userpulldown
	var html = viewTemplate({
		user: user.toJSON()
	})

	$('a, button', this.dom.container).off('.accountController');
	this.dom.container.html(html);

	this._bindModalLinks(this.dom.container)
	this.emit('redrawn')
}

AccountController.prototype._bindModalLinks = function(el, dfd) {
	var that = this;

	var $userPullDown = jQuery('#userPullDown', el);

	$('a, button', el).off('.accountController');

	$('a.login, #btn-sign-in', el).on('click.accountController', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openLoginModal(dfd);
		return false;
	});
	
	$('a.signup', el).on('click.accountController', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openSignupModal(dfd);
		return false;
	});
	
	$('a.forgot', el).on('click.accountController', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openForgotPasswordModal(dfd);
		return false;
	});

	$('a.account', el).on('click.accountController', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openAccountModal(dfd);
		if ($userPullDown.is(':visible'))
			$userPullDown.hide();
		return false;
	});

	$('#btn-account-top', el).on('click.accountController', function(evt){
		evt.preventDefault();
		VizorUI.modalClose();
		$userPullDown.toggle();
		return false;
	});
}

AccountController.prototype.openLoginModal = function(dfd) {
	dfd = dfd || when.defer();
	var loginTemplate = E2.views.partials.account.login;

	var $modal = VizorUI.modalOpen(loginTemplate(), 'Sign in', 'nopad mLogin');
	this._bindModalLinks($modal, dfd);

	var onSuccess = function(response) {
		var user = response.data;

		mixpanel.identify(user.username)
		mixpanel.people.set({
			"$name": user.name,
			username: user.username,
			"$email": user.email
		})

		E2.track({
			event: 'userSignedIn',
			username: user.username
		})

		E2.models.user.set(user)
		bootbox.hideAll()
		dfd.resolve()
	};

	var $form = $('#loginForm', $modal);
	VizorUI.setupXHRForm($form, onSuccess);

	return dfd.promise
}


AccountController.prototype._setupAccountUsernameField = function($input) {
	var currentUsername = (E2.models.user) ? E2.models.user.get('username') : '';
	return VizorUI._setupAccountUsernameField($input, currentUsername);
}

AccountController.prototype.openSignupModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var signupTemplate = E2.views.partials.account.signup();

	E2.track({
		event: 'signInDialogOpened'
	})

	var $modal = VizorUI.modalOpen(signupTemplate, 'Sign up', 'nopad mSignup', true, {backdrop:null});

	that._bindModalLinks($modal, dfd);

	var $form = jQuery('#signupForm', $modal);
	var $usernameField = jQuery('input#username_id', $form);
	var onSuccess = function(response) {
		var user = response.data;

		mixpanel.alias(user.username)
		mixpanel.people.set({
			"$name": user.name,
			username: user.username,
			"$email": user.email
		})

		E2.track({
			event: 'userSignedUp',
			username: user.username
		})

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
	var forgotTemplate = E2.views.partials.account.forgotpassword;
	
	E2.track({
		event: 'forgotDialogOpened'
	})

	var $modal = VizorUI.modalOpen(forgotTemplate({modal:true}), 'Forgot password', 'nopad mForgotpassword');
	this._bindModalLinks($modal, dfd);
	var $form = $('#forgotPasswordForm');
	VizorUI.setupXHRForm($form, function(response) {
		VizorUI.modalClose();
		if (response.success) {
			E2.track({ event: 'forgotPasswordReset' })
			VizorUI.modalAlert(response.message, 'Done');
		}
		dfd.resolve();
	});
	return dfd.promise;
}

AccountController.prototype.openChangePasswordModal = function(dfd) {
	dfd = dfd || when.defer();
	var resetTemplate = E2.views.partials.account.changepassword({modal:true});
	
	E2.track({ event: 'changePasswordDialogOpened' })

	var $modal = VizorUI.modalOpen(resetTemplate, 'Change Password', 'nopad mChangepassword');
	this._bindModalLinks($modal, dfd);
	
	var $form = jQuery('#resetPasswordForm', $modal);
	var onSuccess = function(response) {
		var user = response.data;
		VizorUI.modalClose();
		E2.track({ event: 'passwordChanged', username: user.username })
		VizorUI.modalAlert('Password for ' + user.username + ' was changed.', 'Done');
		dfd.resolve();
	};
	VizorUI.setupXHRForm($form, onSuccess);

	return dfd.promise
}

AccountController.prototype.openAccountModal = function(dfd) {
	var that = this;
	dfd = dfd || when.defer();
	var accountTemplate = E2.views.partials.account.account({user: E2.models.user.toJSON(), modal:true});

	E2.track({ event: 'accountDialogOpened' })

	var $modal = VizorUI.modalOpen(accountTemplate, 'Account', 'nopad mAccountdetails', true)

	jQuery('a#changePasswordLink', $modal).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openChangePasswordModal(dfd);
	});

	// #704
	/*
	jQuery('a#deleteAccountLink', $modal).on('click', function(evt) {
		evt.preventDefault();
		// ...
	});
	*/

	var onSuccess = function(response) {
		var user = response.data;
		E2.models.user.set(user);
		E2.track({ event: 'accountUpdated', username: E2.models.user.get('username') })
		VizorUI.modalClose();
		VizorUI.modalAlert(response.message, 'Done');
		dfd.resolve();
	};

	var $form = jQuery('#accountDetailsForm', $modal);
	VizorUI.setupXHRForm($form, onSuccess);
	return dfd.promise
}

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
