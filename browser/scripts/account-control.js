function AccountControl(handlebars)
{
	this._handlebars = handlebars || window.Handlebars
}

AccountControl.prototype.openLoginModal = function()
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
		console.log( "Handler for .submit() called." );
		event.preventDefault();

		var data = null;

		$.ajax(
		{
			type: "POST",
			url: formEl.attr('action'),
			data: data,
			success: function() { console.log('Success!', arguments); },
			dataType: 'json'
		});
	});
}

AccountControl.prototype.openSignupModal = function()
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
	exports.AccountControl = AccountControl;
