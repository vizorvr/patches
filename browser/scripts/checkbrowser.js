checkBrowser = function() {
	var agent = navigator.userAgent;
	if ((/Chrome/i.test(agent)) || (/Firefox/i.test(agent))) {
		// Good boy browser
	}   
    else if (/Android|webOS|CriOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(agent)) {
		var diag = bootbox.dialog({
			title: '<h3>Mobile support</h3>',
			message: '<h4>Please open this page on your desktop/laptop. '+
					 'Editor is not ready yet to fit limited mobile browsers.</h4>',
			onEscape: true,
			html: true,
			buttons: { Ok: function() {}}
		})

		diag.find('.modal-dialog').addClass('modal-sm')
		diag.css({
			top: '50%',
			'margin-top': function () {
				return -(diag.height() / 2);
			}
		});
	}
    else {
       var diag = bootbox.dialog({
			title: '<h3>Browser support</h3>',
			message: '<h4>We want you to fully enjoy Vizor. Please use '+
					 '<a href="http://www.google.com/chrome/" target="_'+
					 'blank" alt="Get Chrome">Chrome</a> or <a href="ht'+
					 'tp://www.mozilla.org/firefox/new/" target="_blank"'+
					 ' alt="Get Firefox">Firefox</a> to launch Vizor.</h4>',
			onEscape: true,
			html: true,
			buttons: { Ok: function() {}}
		})

		diag.find('.modal-dialog').addClass('modal-sm')
		diag.css({
			top: '50%',
			'margin-top': function () {
				return -(diag.height() / 2);
			}
		});
	}
}