
// requires bootbox

if (typeof msg === 'undefined') var msg = function(msg) {console.error(msg)};

// takes care of common site shell and elements found on "web" pages.
var siteUI = new function() {
	var that = this;

	this.attach = function() {

		// common account forms
		VizorUI.setupXHRForm(jQuery('#accountDetailsForm'));
		VizorUI.setupXHRForm(jQuery('#resetPasswordForm'));
		VizorUI.setupXHRForm(jQuery('#loginForm'));
		VizorUI.setupXHRForm(jQuery('#forgotPasswordForm'));

		jQuery('form.xhr').each(function(){
			VizorUI.setupXHRForm(jQuery(this));
		});


		var $body = jQuery('body');
		VizorUI.enableScrollToLinks($body);
		VizorUI.enablePopupEmbedLinks($body);

		var signupCallback = function() {	// slush
			window.location.href = '/edit';
		};
		var $signupForm = jQuery('#signupForm')
		VizorUI.setupXHRForm($signupForm, signupCallback);
		VizorUI._setupAccountUsernameField(jQuery('input[name=username]', $signupForm)); // currentUsername is still unavailable

	};

	this.init = function() {
		that.attach();

		if (jQuery('body.bHome').length > 0) {
			that.initHomepage();
		}

	};

	this.initHomepage = function($body) {
		jQuery('a#homeSignin', $body).on('click', function(e){
			e.preventDefault();
			e.stopPropagation();
			VizorUI.openLoginModal()
			.then(function(){
				document.location.href="/edit";
			});
			return false;
		});

		jQuery('a.readmore.mobileonly', $body)
			.on('click', function(e){
				e.preventDefault();
				e.stopPropagation();
				jQuery(this).addClass('used');
				var anchor = '#'+this.href.split('#')[1];
				jQuery(anchor)
					.hide()
					.removeClass('nomobile')
					.css({margin: '0 0 10px 0'})
					.slideDown('medium');
				return false;
			});

		$('.team-member').click(function() {
			window.open($(this).find('.profile-link').attr('href'));
		})
		$('.team-button').click(function(e) {
			var teamY = $window.height();
			$("html, body").animate({scrollTop: teamY}, 500);
			e.preventDefault();
			return false;
		});

		var $getStarted = jQuery('section#getstarted').first();
		var onResize = VizorUI.makeVRCanvasResizeHandler(jQuery('#webgl-canvas'), $getStarted);
		$(window).on('resize', onResize);
		$(window).on('vizorLoaded', function() {

			E2.app.isVRCameraActive = function(){return false};	// disable panning on homepage player, see #790
			E2.app.calculateCanvasArea = function() {
                return {
                    width: $getStarted.innerWidth(),
                    height: $getStarted.innerHeight()
                }
            }
			onResize();
		});

		jQuery('button#mobileMenuOpenButton').on('mousedown touchdown', function(e){
			e.preventDefault();
			e.stopPropagation();
			var $mobileMenu = jQuery(E2.views.partials.homeMobileMenu())
				.appendTo('div#contentwrap');
			var menuHeight = $mobileMenu.outerHeight();

			var $body = jQuery('body');
			$body.css({height:menuHeight, overflow:'hidden'});
			$body.scrollTop(0);

			var dismissMenu = function() {
				$body.css({height:'', overflow:'initial'});
				jQuery('#mobilemenu')
					.fadeOut('fast', function(){
						jQuery(this).remove();
					});

				return true;
			}
			jQuery('button#mobileMenuCloseButton', $mobileMenu).on('mousedown touchdown', function(e){
				e.preventDefault();
				e.stopPropagation();
				dismissMenu();
				return false;
			});

			$mobileMenu.fadeIn('fast');
			jQuery('a', $mobileMenu).on('mousedown touchdown', dismissMenu)
			VizorUI.enableScrollToLinks($mobileMenu);

			return false;
		});

	}

}

jQuery('document').ready(siteUI.init);


if (typeof VizorUI === 'undefined') var VizorUI = {};

VizorUI.makeVRCanvasResizeHandler = function($playerCanvas, $containerRef) {
	if (typeof $containerRef === 'undefined') $containerRef = jQuery(window);
	return function() {
		setTimeout(function() {
			var width = $containerRef.width()
			var height = $containerRef.height()
			var devicePixelRatio = window.devicePixelRatio || 1;
			var pixelRatioAdjustedWidth = devicePixelRatio * width;
			var pixelRatioAdjustedHeight = devicePixelRatio * height;

			$playerCanvas[0].width = pixelRatioAdjustedWidth
			$playerCanvas[0].height = pixelRatioAdjustedHeight

			var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement)

			if (isFullscreen) {
				$playerCanvas.removeClass('webgl-canvas-normal')
				$playerCanvas.addClass('webgl-canvas-fs')
			} else {
				$playerCanvas.removeClass('webgl-canvas-fs')
				$playerCanvas.addClass('webgl-canvas-normal')
			}

			E2.core.emit('resize')
		}, 20)
	};
}

// youtube only for the time being
VizorUI.enablePopupEmbedLinks = function($container) {
	var $links = jQuery('a.popup.embed', $container);
	$links.off('.popupembed');

	$links.filter('[href*="youtube"]').on('click.popupembed', function(e){
		e.preventDefault();
		e.stopPropagation();

		var html = E2.views.partials.embedYoutube({src: this.href});
		VizorUI.modalOpen(html, null, 'popupEmbed youtube');
		return false;
	});
}

// a class='scrollto' href='#anchor'
VizorUI.enableScrollToLinks = function($container) {
	jQuery('a.scrollto', $container)
		.off('.scrollto')
		.on('click.scrollto', function(e){
			e.preventDefault();
			e.stopPropagation();
			var href = '#' + this.href.split('#')[1];

			var f = function() {
				var loc = jQuery(href).offset().top;
				$("html, body").animate({ scrollTop: ''+loc+'px' }, 500);
			};
			if (jQuery(href).length > 0)
				f();
			else
				setTimeout(f, 150);

			return false;
		});
}

VizorUI.openLoginModal = function() {
	if (E2 && E2.controllers && E2.controllers.account)
		return E2.controllers.account.openLoginModal();
	// else
	// window.location.href="/account";
	return false;
}

VizorUI.openSignupModal = function() {
	return E2.controllers.account.openSignupModal();
}

VizorUI.userIsLoggedIn = function() {
	var user = E2.models.user.toJSON();
	return (typeof user.username !== 'undefined') && (user.username !== '');
};

/***** INTERIM MODAL LAYER *****/
VizorUI.modalOpen = function(html, heading, className, allowclose, opts) {
	allowclose = (typeof allowclose !== 'undefined') ? !!allowclose : true;
	opts = opts || {}
	opts.message = html;
	opts.onEscape = allowclose;
	if (typeof opts.backdrop === 'udefined') opts.backdrop = allowclose;	// bb 4.4+
	if ((typeof heading !== 'undefined') && heading) opts.title = heading;
	if ((typeof className !== 'undefined') && className) opts.className = className;
	return bootbox.dialog(opts);
};

VizorUI.modalClose = function() {
	bootbox.hideAll();
};

// shorthand
VizorUI.modalAlert = function(message, heading, className, okLabel) {
	var opts = {
		buttons: {
			OK : {
				label: okLabel || "OK",
				callback: function(){}
			}
		}
	}
	return VizorUI.modalOpen('<p>'+message+'</p>', heading, className, true, opts);
}

VizorUI.isMobile = {
	Android: function() {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
		return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
	},
	any: function() {
		return E2.util.isMobile();
	}
}

/**
 * adds handler to check whether desired username is available.
 * this is used in the signup form, and may be used in the account details form
 * @param $input jQuery
 * @param currentUsername string
 */
VizorUI._setupAccountUsernameField = function($input, currentUsername) {
	var _t = null;
	var lastValue=false;
	$input.on('keyup', function(e){
		var value = $input.val().trim();
		var checkUsername = currentUsername || E2.models.user.get('username');	// last resort
		if (value && (value !== checkUsername) && (value !== lastValue)) {
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
};

/**
 * enables a form to submit and process its response via xhr call
 * validation is done in backend
 * @param $form
 * @param onSuccess
 */
VizorUI.setupXHRForm = function($form, onSuccess) {	// see views/account/signup for example

	var xhrEnabled = $form.data('xhrEnabled');
	if (xhrEnabled) {
		msg("ERROR: setupXHRForm but form already enabled " + $form.attr('id'))
		return false;
	}

	if (typeof onSuccess !== 'function') {
		onSuccess = function(response) {
			if (response && (typeof response.redirect !== 'undefined') && (response.redirect)) {
				window.location.href = response.redirect
				return;
			}
			// append a message to our form
			var message = jQuery('<p></p>')
							.text(response.message)
							.addClass('xhr success message');
			$form.append(message);
			$form.find(':focus').trigger('blur');

			var detail = {
				id: 		$form.attr('id'),
				response: 	response
			};
			var successEvent = new CustomEvent(uiEvent.xhrFormSuccess, {detail: detail});
			document.dispatchEvent(successEvent);
		}
	}

	$form.find('input, textarea').each(function(){
		var $this = jQuery(this);
		var placeholder = $this.attr('placeholder');
		var required = $this.hasClass('required');
		var had_error = false;
		var had_error_value = false;
		if (placeholder) {
			if (required) placeholder += '*';
			$this.attr('placeholder', placeholder);
			$this.on('focus', function(){
				had_error = $this.parent().hasClass('error');
				had_error_value = (had_error) ? $this.val() : false;
				$this.parent().removeClass('error').find('span.message').html('');
				$this.addClass('in_focus');
				// ux
				//	$this.data('placeholder', placeholder);
				//	$this.attr('placeholder', '');
				return true;
			});

			$this.on('blur', function(){
				// ux
				//	$this.attr('placeholder', $this.data('placeholder'));
				$this.removeClass('in_focus');
				if (required && had_error &&
					(($this.val() === '') || ($this.val() === had_error_value))
					) $this.parent().addClass('error');
				return true;
			});
		}
	});

	var inProgress = false;
	var $body = jQuery(document.body);

	$form.submit(function(event) {

		if (inProgress) return false;

		// if (!can_submit) return false;

		// future decision on forms without this set
		var actionURL = $form.attr('action');
		if (!actionURL) return true;

		event.preventDefault();
		var formData = $form.serialize();

		$form.find('p.xhr.success.message').remove();
		$form.find('span.message').html('');
		$form.find('div.form-input').removeClass('error');

		var $unknownError = jQuery('#unknown_error', $form);
		if ($unknownError.length < 1) $unknownError = jQuery('.genericError', $form);
		$unknownError.html('').hide();
		inProgress = true;
		$body.addClass('loading');
		jQuery.ajax({
			type:	'POST',
			url:	actionURL,
			data:	formData,
			dataType: 'json',
			error: function(err) {
				inProgress = false;
				$body.removeClass('loading');
				if (err.responseJSON) {
					var json = err.responseJSON;
					var errors
					// best case expect err.responseJSON.errors[{msg:'',param:'',value:''}, ...]
					if (json.errors instanceof Array) {
						errors = json.errors
					} // exceptions follow
					else if (json instanceof Array) {
						// validation returns array, but some simple responses only have message
						errors = json;
						msg("ERROR: #596 lazy format error");
						console.log(errors);
					}
					else if (json.error && json.error.errors){	// graphController
						errors = [];
						var ers = json.error.errors;
						for (var key in ers) {
							if (ers.hasOwnProperty(key)) {
								errors.push({
									param: key,
									msg: ers[key].message
								});
							}
						}
					}
					else if (json.error && json.error.status) {
						errors = [json.error];
					}
					else {
						msg("ERROR: #596 lazy format error");
						console.log(json);
						errors = [{
							param:	json.param || '',
							msg:	json.message
						}];
					}
					errors.map(function(ei) {
						var $field = $form.find('#f_'+ei.param);

						if (ei.param && (ei.msg || ei.message) && ($field.length>0)) {
							$field.addClass('error')
								.find('span.message').html(ei.msg || ei.message)
						} else {
							// in case no 'param' comes back
							$unknownError.html($unknownError.html() + '<span>'+ (ei.msg || ei.message) + '</span>').show();
						}
					});
					if (!errors.length) {	// should errors be empty
						$unknownError.html($unknownError.html() + '<span>'+ (json.message) + '</span>').show();
					}
				} else {
					if (err.status === 200) {	// the response was deemed an error but has good status (jQuery timeout / last resort)
						$unknownError.html('<span>The server said: (' + err.status + '): ' + err.statusText +'</span>').show();
					} else {
						// in case no json comes back, e.g. just a code
						$unknownError.html('<span>An error ('+err.status+') occurred. Please check all required fields</span>').show();
					}
				}
			},
			success: function() {
				inProgress = false;
				$body.removeClass('loading');
				onSuccess.apply(this,arguments);
			}

		});
		return false;
	});

	$form.data('xhrEnabled', true);
};

/**
 * replaces all svg buttons that have a data-svgref attribute,
 * if class .tiny also moving text from the content of the button to a popover tooltip
 * @param $selector jQuery
 * @returns {boolean} replaced any
 */
VizorUI.replaceSVGButtons = function($selector) {

	var numReplaced=0;
	$selector.find('button.svg[data-svgref!=""]').each(function(){
		var $button = jQuery(this);
		var xref = $button.data('svgref');
		if (!xref) return;

		numReplaced++;
		var usehtml = "<use xlink:href='#"+ xref +"'></use>"	// browser won't parse this custom tag unless in svg
		var $svg = jQuery('<svg>'+usehtml+'</svg>');

		$button.data('svgref', false).attr('data-svgref','');

		if ($button.hasClass('tiny')) {
			$button.popover({
				content: $button.text(),
				delay: {
					show: 1000,
					hide: 100
				},
				placement: 'auto top',
				trigger: 'hover'
			});
			$button.text('');
		}
		// place an empty <svg> wherever you want the image, or one will be appended
		var $existingSvg = jQuery('svg', $button);
		if ($existingSvg.length > 0)
			$existingSvg.replaceWith($svg);
		else
			$button.append($svg);
	});

	return (numReplaced>0);
};

/**
 * wires up svg buttons on asset card to fire events as per assetUIEvent
 * @param $card
 */
VizorUI.setupAssetCard = function($card) {

	VizorUI.replaceSVGButtons($card);

	jQuery('button', $card).off('.assetUI');	// remove just us from all buttons

	jQuery('button.action', $card).on('click.assetUI', function(e){
		var $this = jQuery(e.currentTarget);
		$card = $this.parents('article.asset.card').first();
		if (!$card) return true;
		var detail = {
			id: 	$card.data('objectid'),
			url: 	$card.data('url'),
			type: 	$card.data('asset-type'),
			action:	$this.data('action')
		};
		var eventName = detail.type + '.' + detail.action;	// e.g. graph.open, project.delete
		var cardEvent = new CustomEvent(eventName, {detail: detail});
		document.dispatchEvent(cardEvent);
		return true;
	});

	return true;
}

VizorUI.toggleAccountDropdown = function() {
	if (VizorUI.userIsLoggedIn()) {
		jQuery('#userPullDown').toggle();
	}
	return false;
}