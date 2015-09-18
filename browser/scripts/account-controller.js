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

AccountController.prototype._bindEvents = function(el, dfd)
{
	var that = this;
	
	$('.form-input input', el).on('focus', function() {
		$(this).parent().removeClass('wrong').find('label').addClass('filled-label');
		if ($('#login-error').hasClass('revealError')) {
			$('#login-error').addClass('hideError')
							 .removeClass('revealError');
			setTimeout(function() {
				$('#login-error').removeClass('hideError')
								 .find('span')
								 .html('');
			},1000)
		}
	});
	$('.form-input input', el).on('blur', function() {
		if (!$(this).val())
			$(this).parent().find('label').removeClass('filled-label');
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
	var customFooter = '<span class="pull-left"><a href="/forgot"'
					+ 'class="forgot">Forgot password?</a></span>'
					+ '<span class="pull-right">Don\'t have an account? '
					+ '<a href="/signup" class="signup">Sign up here</a></span>';

	ga('send', 'event', 'account', 'open', 'loginModal');
	
	customFooter = '<div class="modal-footer">' + customFooter + '</div>';

	var bb = bootbox.dialog({
		animate: false,
		show: true,
		title: 'Sign in',
		message: loginTemplate(),
	}).init(function() {
		E2.app.replaceDefaultCross();
		$('.modal-content').append(customFooter);
	});

	this._bindEvents(bb, dfd);

	var formEl = $('#login-form_id');
	formEl.submit(function( event )
	{
		event.preventDefault();

		var formData = formEl.serialize();

		$.ajax(
		{
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err)
			{	
				var erText = 'Whoops! This email and password combination isn\'t right.'
				$('#login-error span').html(erText);
				$('#login-error').addClass('revealError');
				$('#login-form_id .form-input').addClass('wrong');
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

	ga('send', 'event', 'account', 'open', 'signupModal')

	var bb = bootbox.dialog(
	{
		show: true,
		animate: false,
		message: signupTemplate(),
		//title: "loginDialog"
		//onEscape: function() {  }
	}).init(function() {
		E2.app.replaceDefaultCross();
	});

	this._bindEvents(bb, dfd);

	var formEl = $('#signup-form_id');
	formEl.submit(function( event )
	{
		event.preventDefault();

		var formData = formEl.serialize();

		$.ajax(
		{
			type: "POST",
			url: formEl.attr('action'),
			data: formData,
			error: function(err, msg)
			{
				console.log(err);
				bootbox.alert("Sorry, creating your account failed. Please make sure to fill in all the fields correctly.");
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
