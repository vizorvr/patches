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

	this._bindEvents(E2.dom.userPullDown)

	this.emit('redrawn')
}

AccountController.prototype.isValidEmail = function(email) {
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    return re.test(email);
}

AccountController.prototype.showError = function(ertype, ertext) {
	$('#'+ertype+'-error span').html(ertext);
	$('#'+ertype+'-error').addClass('revealError');
	
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
		
	};
}

AccountController.prototype.checkSignupFields = function() {
	var that = this;
	var result = false;
	if (($('#username_id').val()) && (!$('#username_id').hasClass('taken')) && ($('#email_id').val()) && (that.isValidEmail($('#email_id').val())) && ($('#password_id').val().length>=8)) {
		result = true;
	}
	return result;
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

AccountController.prototype._bindEvents = function(el, dfd)
{
	var that = this;
	
	$('.form-input input', el).on('focus', function() {
		$(this).parent().removeClass('wrong').find('label').addClass('filled-label');
		var errorTypeToCheck=$(this).attr('name');
		that.hideError(errorTypeToCheck);
		that.hideError('general');
		if ($(this).hasClass('taken'))
			$(this).val('').removeClass('taken');
	});
	$('.form-input input', el).on('blur', function() {
		var currentUsername = '';
		if (!$(this).val())
			$(this).parent().find('label').removeClass('filled-label');
			
		if ($(this).attr('name') === 'password' && $(this).val().length < 8 && $('#signup-form_id').length) {
			var errText = 'Please use a password of at least 8 characters' 
			that.showError('password',errText);
		}
		if (E2.models.user.get('username')) {
			currentUsername = E2.models.user.get('username');
		}
		if (($(this).attr('name') === 'username') && $(this).val() && $(this).val()!==currentUsername) {
			return
			var formEl = $('#signup-form_id');
			var formData = formEl.serialize();
			$.ajax(
				{
					type: "POST",
					url: '/account/exists',
					data: formData,
					error: function(err, msg) {
						var errText = 'Sorry, this username is already taken'
						that.showError('username',errText);
						$('#username_id').addClass('taken').parent().addClass('wrong');
					},
					success: function(user) {
						ga('send', 'event', 'account', 'signedUp', user.username)
						that.hideError('username');
					},
					dataType: 'json'
			});
		}
		
		if ($(this).attr('name') === 'email' && !that.isValidEmail($(this).val())) {
			var errText = 'Whoops! This isn\'t a valid email address' 
			that.showError('email',errText);
		}
	});
	
	$('#signup-form_id .form-input input').on('keyup keypress blur change', function() {
		if (that.checkSignupFields()) {
			$('#sign-up-btn').removeClass('disabled');
		} else {
			$('#sign-up-btn').addClass('disabled');
		}
	});
	
	$('a.login', el).on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		that.openLoginModal(dfd);
	});
	
	$('a.signup', el).on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		that.openSignupModal(dfd);
	});
	
	$('a.forgot', el).on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		that.openForgotPasswordModal(dfd);
	});
	
	$('a.change-password', el).on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		that.openResetPasswordModal(dfd);
	});
	$('a.account', el).on('click', function(evt)
	{
		evt.preventDefault();
		bootbox.hideAll();
		that.openAccountModal(dfd);
		if (E2.dom.userPullDown.is(':visible'))
			E2.dom.userPullDown.hide();
	});
}

AccountController.prototype.openLoginModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var loginTemplate = E2.views.account.login;

	ga('send', 'event', 'account', 'open', 'loginModal');
	
	var bb = bootbox.dialog({
		animate: false,
		show: true,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(loginTemplate());
	});

	this._bindEvents(bb, dfd);

	var formEl = $('#login-form_id');
	formEl.submit(function( event ) {
		event.preventDefault();
		
		if (!that.isValidEmail(formEl.find('#email_id').val())) {
			var errText = 'Whoops! That isn\'t a valid email address.';
			that.showError('email',errText);
			return;
		}

		var formData = formEl.serialize();

		$.ajax({
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err) {
				err.responseJSON.map(function(error) {
					that.showError('general', error.message);
				})
			},
			success: function(user) {
				ga('send', 'event', 'account', 'loggedIn', user.username)
				E2.models.user.set(user);
				bootbox.hideAll();
				dfd.resolve()
			},
			dataType: 'json'
		});
	});

	return dfd.promise
}

AccountController.prototype.openSignupModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var signupTemplate = E2.views.account.signup;
	
	ga('send', 'event', 'account', 'open', 'signupModal');

	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(signupTemplate);
	});

	this._bindEvents(bb, dfd);

	var formEl = $('#signup-form_id');
	formEl.submit(function( event ) {
		event.preventDefault();
		
		if (!that.checkSignupFields(formEl)) {
			var errText = 'Please fill all required fields.'
			that.showError('general',errText);
			$('#signup-form_id .required').parent.addClass('wrong');
			return;
		}
			
		var formData = formEl.serialize();

		$.ajax({
			type: 'POST',
			url: formEl.attr('action'),
			data: formData,
			error: function(err) {
				if (err.responseJSON) {
					err.responseJSON.map(function(ei) {
						that.showError(ei.param, ei.msg)
					})
				} else {
					var errText = 'Sign up failed. Please check required fields.'
					that.showError('general', errText);
				}

				$('#signup-form_id .required').parent().addClass('wrong');
			},
			success: function(user) {
				ga('send', 'event', 'account', 'signedUp', user.username)
				E2.models.user.set(user);
				bootbox.hideAll();
				dfd.resolve()
			},
			dataType: 'json'
		});
	});

	return dfd.promise
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

	this._bindEvents(bb, dfd);
	
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
	
	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(resetTemplate);
	});

	this._bindEvents(bb, dfd);
	
	var formEl = $('#reset-form_id');
	formEl.submit(function( event )
	{
		event.preventDefault();
		
		if (formEl.find('#password_id').val() !== formEl.find('#password-confirm_id').val()) {
			var errText = 'Whoops! Passwords don\'t match.';
			that.showError('confirm',errText);
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
				var errText = 'Please try another password.'
				that.showError('general',errText);
			},
			success: function(user)
			{
				ga('send', 'event', 'account', 'passwordChanged', user.username)
				bootbox.hideAll();
				bootbox.alert('Password changed! You can sign in now.');
				dfd.resolve();
			},
			dataType: 'json'
		});
	});

	return dfd.promise
}

AccountController.prototype.fillAccountForm = function() {
	var formEl = $('#account-modal-form');
	var nameIn = $('#name_id');
	var unameIn = $('#username_id');
	var emailIn = $('#email_id');
	nameIn.val(E2.models.user.get('name'));
	unameIn.val(E2.models.user.get('username'));
	emailIn.val(E2.models.user.get('email'));
	
	if (nameIn.val())
		nameIn.parent().find('label').addClass('filled-label');
	if (unameIn.val())
		unameIn.parent().find('label').addClass('filled-label');
	if (emailIn.val())
		emailIn.parent().find('label').addClass('filled-label');
}

AccountController.prototype.openAccountModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var accountTemplate = E2.views.account.account;
	
	ga('send', 'event', 'account', 'open', 'accountModal');
	
	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: 'Rendering',
	}).init(function() {
		E2.app.useCustomBootboxTemplate(accountTemplate);
		that.fillAccountForm();
	});

	this._bindEvents(bb, dfd);
	
	var formEl = $('#account-modal-form');
	formEl.submit(function( event ) {
		event.preventDefault();
		
		var formData = formEl.serialize();

		$.ajax({
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err) {
				if (err.responseJSON) {
					err.responseJSON.map(function(ei) {
						that.showError(ei.param, ei.msg)
					})
				} else {
					var errText = 'Account update failed.'
					that.showError('general', errText);
				}
			
				$('#signup-form_id .required').parent().addClass('wrong');
			},
			success: function(user)
			{
				ga('send', 'event', 'account', 'accountUpdated', user.username)
				bootbox.hideAll();
				bootbox.alert('Account updated!');
				dfd.resolve();
			},
			dataType: 'json'
		});
		return false;
	});

	return dfd.promise
}

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
