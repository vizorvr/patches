function AccountController(handlebars)
{
	this._handlebars = handlebars || window.Handlebars

	E2.models.user.on('change', this.renderLoginView.bind(this));

	this._bindEvents();
}

AccountController.prototype.renderLoginView = function(user)
{
	var viewTemplate = E2.views.partials.userpulldown;
	var html = viewTemplate({ user: user.toJSON() });
	$('#user-pulldown').replaceWith(html);

	this._bindEvents($('#user-pulldown'));
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
			$('#login-form_id #email_id').addClass('wrong');
			break;
		}
		case (ertype === 'username'): {
			$('#login-form_id #username_id').addClass('wrong');
			break;
		}
		case (ertype === 'password'): {
			$('#login-form_id #username_id').addClass('wrong');
			break;
		}
	};
}

AccountController.prototype.checkSignupFields = function() {
	var that = this;
	var result = false;
	if (($('#username_id').val()) && ($('#email_id').val()) && (that.isValidEmail($('#email_id').val())) && ($('#password_id').val().length>=8)) {
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
	});
	$('.form-input input', el).on('blur', function() {
		if (!$(this).val())
			$(this).parent().find('label').removeClass('filled-label');
			
		if ($(this).attr('name') === 'password' && $(this).val().length < 8) {
			var errText = 'Please use a password of at least 8 characters' 
			that.showError('password',errText);
		}
		
		if ($(this).attr('name') === 'email' && !that.isValidEmail($(this).val())) {
			var errText = 'Whoops! This isn\'t a valid email address.' 
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
	formEl.submit(function( event )
	{
		event.preventDefault();
		
		if (!that.isValidEmail(formEl.find('#email_id').val())) {
			var errText = 'Whoops! This isn\'t a valid email address.';
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
				var errText = 'Whoops! This email and password combination isn\'t right.'
				that.showError('general',errText);
			},
			success: function(user)
			{
				console.log('Logged in as ' + user.username);
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
	formEl.submit(function( event )
	{
		event.preventDefault();
		
		if (!that.checkSignupFields(formEl)) {
			var errText = 'Please fill all required fields.'
			that.showError('general',errText);
			$('#signup-form_id .required').parent.addClass('wrong');
			return;
		}
			
		var formData = formEl.serialize();

		$.ajax(
		{
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err, msg)
			{
				console.log(err);
				var errText = 'Sign up failed. Please check required fields.'
				that.showError('general',errText);
				$('#signup-form_id .required').parent().addClass('wrong');
			},
			success: function(user)
			{
				console.log('Signed up as ' + user.username);
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

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
