function AccountController(handlebars)
{
	this._handlebars = handlebars || window.Handlebars

	E2.models.user.on('change', this.renderLoginView.bind(this));

	this._init();
}

AccountController.prototype.renderLoginView = function(user)
{
	var viewTemplate = Handlebars.getTemplate('partials/userpulldown');
	var html = viewTemplate({ user: user.toJSON() });
	$('#user-pulldown').replaceWith(html);

	this._init();
}

AccountController.prototype._init = function()
{
	var that = this;

	$('#loginButton').on('click', function(evt)
	{
		evt.preventDefault();
		that.openLoginModal();
	});
}

AccountController.prototype.openLoginModal = function()
{
	var self = this;

	var loginTemplate = Handlebars.getTemplate('account/login');
	var bb = bootbox.dialog(
	{
		message: loginTemplate(),
		//title: "loginDialog"
		//onEscape: function() {  }
	});

	var formEl = $('#signin-form_id');
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
				console.log(err);
				bootbox.alert('Login failed!');
			},
			success: function(user)
			{
				console.log('Logged in as ' + user.username);
				E2.models.user.set(user);
				bb.modal('hide');
			},
			dataType: 'json'
		});
	});
}

AccountController.prototype.openSignupModal = function()
{
	var self = this;

	var signupTemplate = Handlebars.getTemplate('account/signup');
	var bb = bootbox.dialog(
	{
		message: signupTemplate(),
		//title: "loginDialog"
		//onEscape: function() {  }
	});

	console.log(bb);

}

if (typeof(exports) !== 'undefined')
	exports.AccountController = AccountController;
