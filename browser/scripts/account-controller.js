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
			var formEl = $('#signupForm');
			var formData = formEl.serialize();
			$.ajax({
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
			var errText = 'Whoops! This is not a valid email address'
			that.showError('email',errText);
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
	

	$('a.account', el).on('click', function(evt)
	{
		evt.preventDefault();
		VizorUI.modalClose();
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

	var bb = VizorUI.modalOpen(loginTemplate(), null, 'nopad login')

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
	var signupTemplate = E2.views.account.signup();
	
	ga('send', 'event', 'account', 'open', 'signupModal');

	var bb = VizorUI.modalOpen(signupTemplate, null, 'nopad mSignup').init(function(){
		console.log(this);
		console.log(bb);
		console.log(dfd);
		/*
		that._bindEvents(bb, dfd);

		var $form = jQuery('#signupForm');
		jQuery('.form-input input', $form).on('keyup keypress blur change', function() {
			if (that.checkSignupFields()) {
				$('#sign-up-btn').removeClass('disabled');
			} else {
				$('#sign-up-btn').addClass('disabled');
			}
		});

		$form.submit(function( event ) {
			event.preventDefault();

			if (!that.checkSignupFields()) {
				var errText = 'Please fill all required fields.'
				that.showError('general',errText);
	//			jQuery('.required', $form).parent.addClass('wrong');
				return;
			}

			var formData = $form.serialize();

			jQuery.ajax({
				type: 'POST',
				url: $form.attr('action'),
				data: formData,
				dataType: 'json',
				error: function(err) {
					console.log(err, err.response, err.responseJSON)
					if (err.responseJSON) {
						err.responseJSON.map(function(ei) {
							that.showError(ei.param, ei.msg)
						});
					} else {
						var errText = 'Sign up failed. Please check required fields.'
						that.showError('general', errText);
					}

	//				jQuery('.required', $form).parent().addClass('wrong');	// this is probably wrong
				},
				success: function(user) {
					ga('send', 'event', 'account', 'signedUp', user.username)
					E2.models.user.set(user);
					VizorUI.modalClose();
					dfd.resolve()
				}
			});
		});
		*/
	});


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

	var bb = VizorUI.modalOpen(resetTemplate, null, 'nopad');
	this._bindEvents(bb, dfd);
	
	var $formEl = jQuery('#resetpasswordform');

	$formEl.on('submit', function( event ) {
		event.preventDefault();
		
		if ($formEl.find('#passwordinput').val() !== $formEl.find('#confirmpasswordinput').val()) {
			var errText = 'Whoops! Passwords do not match.';
			that.showError('confirm',errText);
			return false;
		}

		var formData = $formEl.serialize();
		jQuery.ajax({
			type: "POST",
			url: $formEl.attr('action'),
			data: formData,
			error: function(err) {
				var errText = 'Please try another password.'
				that.showError('general',errText);
			},
			success: function(data) {
				var user = data.user;
				ga('send', 'event', 'account', 'passwordChanged', user.username)
				VizorUI.modalClose();
				bootbox.alert('Password for ' + user.username + ' was changed.');
				dfd.resolve();
			},
			dataType: 'json'
		});
		return false;
	});

	return dfd.promise
}

AccountController.prototype.checkAccountFormFilled = function() {
	var formEl = $('#account-modal-form');
	var nameIn = $('#name_id', formEl);
	var unameIn = $('#username_id', formEl);
	var emailIn = $('#email_id', formEl);

	nameIn.parent().find('label').toggleClass('filled-label', !!nameIn.val());
	unameIn.parent().find('label').toggleClass('filled-label', !!unameIn.val());
	emailIn.parent().find('label').toggleClass('filled-label', !!emailIn.val());
}

AccountController.prototype.openAccountModal = function(dfd) {
	var that = this;
	var dfd = dfd || when.defer();
	var accountTemplate = E2.views.account.account({user: E2.models.user.toJSON()});

	ga('send', 'event', 'account', 'open', 'accountModal');

	var bb = VizorUI.modalOpen(accountTemplate, null, 'nopad', true)
	this.checkAccountFormFilled();
	jQuery('a#changePasswordLink', bb).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
		that.openResetPasswordModal(dfd);
	});
	/*
	jQuery('a#deleteAccountLink', bb).on('click', function(evt) {
		evt.preventDefault();
		VizorUI.modalClose();
	});
	*/


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
			success: function(data) {
				var user = data.user;
				E2.models.user.set(user);
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
