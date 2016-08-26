function AccountController() {
	EventEmitter.call(this)

	this._model = E2.models.user
	this.dom = {
		accountDropdown : jQuery('#account'),
		profilePanel: jQuery('#profileheader'),
		userHeader: jQuery('body.bProfile header, body.bUserpage header')
	}

	E2.models.user.on('change', this.renderLoginView.bind(this))
	E2.models.user.on('change', this.renderProfileView.bind(this))
	E2.models.user.on('change', this.renderHeaderView.bind(this))

	// bind dropdown
	this._bindModalLinks(this.dom.accountDropdown)

}

AccountController.prototype = Object.create(EventEmitter.prototype)

AccountController.prototype._renderView = function(user, view, container, cb) {
	if (!container.length)
		return

	var data = user.toJSON()

	var html = view(data)

	$('a, button', container).off('.accountController')
	container.html(html)

	if (cb)
		cb(container, user)

	this.emit('redrawn')
}

AccountController.prototype.renderLoginView = function(user) {
	if (!this.dom.accountDropdown.length)
		return

	return this._renderView(user, 
		E2.views.partials.userpulldown,
		this.dom.accountDropdown,
		this._bindModalLinks.bind(this)
	)
}

AccountController.prototype.renderHeaderView = function(user) {
	if (!this.dom.userHeader.length)
		return

	if (this.dom.userHeader.data('uid') !== user.id)
		return

	var profile = user.get('profile')

	this.dom.userHeader.css({
		'background-image': 'url('+(profile.header || '')+')'
	})
}

AccountController.prototype.renderProfileView = function(user) {
	if (!this.dom.profilePanel.length)
		return
	
	return this._renderView(user, 
		E2.views.partials.profile,
		this.dom.profilePanel
	)
}

AccountController.prototype._bindModalLinks = function(el, dfd) {
	var that = this;

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

	if (el.length)
		Array.prototype.forEach.call(el[0].querySelectorAll('[data-hideshow-target]'), VizorUI.hideshow)

}

AccountController.prototype.openLoginModal = function(dfd) {
	dfd = dfd || when.defer();
	var loginTemplate = E2.views.partials.account.login;

	var data = {profile:this._model.toJSON()}
	var $modal = VizorUI.modalOpen(loginTemplate(data), 'Sign in', 'nopad mLogin');
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
		dfd.resolve(user)
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


	var data = {
		modal:true,
		loggedIn: false,
		email: ''
	}

	var user = E2.models.user.toJSON()
	data.loggedIn = (typeof user.username !== 'undefined') && (user.username !== '')
	if ((typeof user.email !== 'undefined') && (user.email !== ''))
		data.email = user.email

	var $modal = VizorUI.modalOpen(forgotTemplate(data), 'Forgot password', 'nopad mForgotpassword');
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
	var data = {
		profile: this._model.toJSON(),
		modal: true
	}
	var accountTemplate = E2.views.partials.account.account(data);

	E2.track({ event: 'accountDialogOpened' })

	var $modal = VizorUI.modalOpen(accountTemplate, 'Account', 'nopad mAccountdetails', true)

	jQuery('a#changePasswordLink', $modal).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openChangePasswordModal(dfd);
	});


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
