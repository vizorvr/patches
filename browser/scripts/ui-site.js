
// requires bootbox

if (typeof msg === 'undefined') var msg = function(msg) {console.error(msg)};

// takes care of common site shell and elements found on "web" pages.
var siteUI = new function() {
	var that = this;

	// same as in css
	var breakMobile = 550;
	var breakTablet = 1024;

	if (window.matchMedia) {
		this.mqMobile = window.matchMedia("only screen and (max-width: "+ (breakMobile-1) +"px)")
		this.mqTablet = window.matchMedia("screen and (max-width: "+ (breakTablet-1) +"px)")
		this.mqDesktop = window.matchMedia("screen and (min-width: "+  breakTablet    +"px)")
	} else {
		this.mqMobile = this.mqTablet = this.mqDesktop = { matches: false }
	}

	this.devicePixelRatio = window.devicePixelRatio || 1;
	this.hasOrientationChange = "onorientationchange" in window;
	this.previousOrientation = (this.hasOrientationChange) ? window.orientation : null;

	// states (bool)
	this.lastLayout = null;
	this.lastPortrait = null;
	this.isEmbedded = null;
	this.isDragging = null;


	this.onResize = function() {
		that.tagBodyClass();
		return true;
	};

	this.attach = function() {

		var $body = jQuery('body');
		this._setupDragRecognition()

		$(window).on('resize', this.onResize);
		if (that.hasOrientationChange) {
			$(window).on('orientationchange', function () {
				$body
					.removeClass('orientationInitial')
					.addClass('orientationChanged');
				that.onResize();
				return true;
			})
			$body.addClass('orientationInitial');
		}

		// common account forms
		VizorUI.setupXHRForm(jQuery('#accountDetailsForm'));
		VizorUI.setupXHRForm(jQuery('#resetPasswordForm'));
		VizorUI.setupXHRForm(jQuery('#loginForm'));
		VizorUI.setupXHRForm(jQuery('#forgotPasswordForm'));

		jQuery('form.xhr').each(function(){
			VizorUI.setupXHRForm(jQuery(this));
		});

		VizorUI.enableScrollToLinks($body);
		VizorUI.enablePopupEmbedLinks($body);

		var signupCallback = function() {	// slush
			window.location.href = '/edit';
		};
		var $signupForm = jQuery('#signupForm')
		VizorUI.setupXHRForm($signupForm, signupCallback);
		VizorUI._setupAccountUsernameField(jQuery('input[name=username]', $signupForm)); // currentUsername is still unavailable

		$(document).on("shown.bs.modal", function() {
			$('.bootbox-close-button')
				.html('<svg class="icon-dialog-close"><use xlink:href="#icon-close"></use></svg>')
				.attr('style','opacity:1');
		});
	};

	this._setupDragRecognition = function(domElement, dragThresholdPx) {
		dragThresholdPx = dragThresholdPx || 3

		var that = this;
		domElement = domElement || document
		var dragThreshold = dragThresholdPx * dragThresholdPx

		var up = function(data) { return function(e) {
			that.isDragging = false;
			document.removeEventListener('mousemove', data.move, true)
			document.removeEventListener('touchmove', data.move, true)
			document.removeEventListener('mouseup', data.up)
			document.removeEventListener('touchcancel', data.up)
			document.removeEventListener('touchend', data.up)
			window.removeEventListener('blur', data.up)
			return true
		}}

		function move(data) {
			function findTouch(inTouches, touchId){
				for (var i in inTouches) {
					if (inTouches[i].identifier === touchId)
						return inTouches[i]
				}
				return null
			}
			return function(e) {
				var t = (e.touches) ? findTouch(e.changedTouches, data.touchId) : e;
				if (!t) return true; // something extraordinary must have happened
				var distSquared = data.origin.distanceSq(t)
				if (distSquared > dragThreshold)
					that.isDragging = true;
				return true;
			}
		}

		function onStart(e) {
			var t = (e.touches) ? e.changedTouches[0] : e;
			var data = {
				touchId : t.identifier || 0,
				origin: {
					pageX: t.pageX,
					pageY: t.pageY,
					distanceSq: function(fromPointer){
						var dx = fromPointer.pageX - data.origin.pageX,
							dy = fromPointer.pageY - data.origin.pageY;
						return dx*dx + dy*dy
					}
				}
			}
			data.up = up(data)
			data.move = move(data)
			window.addEventListener('blur', data.up)
			document.addEventListener('touchend', data.up)
			document.addEventListener('touchcancel', data.up)
			document.addEventListener('mouseup', data.up)
			document.addEventListener('touchmove', data.move, true)
			document.addEventListener('mousemove', data.move, true)
		}

		domElement.addEventListener('touchstart', onStart)
		domElement.addEventListener('mousedown', onStart)
	}


	this.init = function() {
		that.tagBodyClass();
		that.attach();

		if (jQuery('body.bHome').length > 0) {
			that.initHomepage();
		}
	};

	this.initHomepage = function($body) {
        mixpanel.track('Front Page')

		$body = $body || jQuery('body');

		jQuery('a#homeSignin', $body).on('click', function(e){
			e.preventDefault();
			e.stopPropagation();
			VizorUI.openLoginModal()
			.then(function(){
				document.location.href="/edit";
			});
			return false;
		});

		jQuery('h3.readmore a', $body)
			.on('click', function(e){
				if (this.href.split('#').length <= 1) return true;	// not for us
				e.preventDefault();
				e.stopPropagation();
				if (!$body.hasClass('layoutMobile')) return false;

				var anchor = '#'+ this.href.split('#')[1];
				var $target = jQuery(anchor);
				var $a = jQuery(this);

				var wasVisible = $target.is(':visible');
				if (wasVisible) {
					$target
						.slideUp('medium', function(){
							jQuery(this)
								.addClass('nomobile')
								.css({margin: '0'})
								.show()
						})
				} else {
					$target
						.hide()
						.removeClass('nomobile')
						.css({margin: '0 0 10px 0'})
						.slideDown('medium')
				}

				$a
					.toggleClass('closed', wasVisible)
					.toggleClass('open', !wasVisible);
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

		var $homePlayerContainer = jQuery('#player_home');
		var onResize = VizorUI.makeVRCanvasResizeHandler(jQuery('#webgl-canvas'), $homePlayerContainer);
		$(window).on('resize', onResize);
		$(window).on('vizorLoaded', function() {

			E2.app.canInitiateCameraMove = function(){return false};	// disable panning on homepage player, see #790
			E2.app.calculateCanvasArea = function() {
                return{
                    width: $homePlayerContainer.innerWidth(),
                    height: $homePlayerContainer.innerHeight()
                }
            }

			WebVRConfig.getContainerMeta = E2.app.calculateCanvasArea
			onResize();
		});

		jQuery('button#mobileMenuOpenButton').on('mousedown touchdown', function(e){
			e.preventDefault();
			e.stopPropagation();
			var $contentWrap = jQuery('div#contentwrap')
			var $mobileMenu = jQuery(E2.views.partials.homeMobileMenu())
				.appendTo('div#contentwrap');
			var menuHeight = $mobileMenu.outerHeight();

			var $body = jQuery('body');
			var css = {height:menuHeight, overflow:'hidden'};
			$body.css(css);
			$body.scrollTop(0);
			$contentWrap.css(css);

			var dismissMenu = function() {
				var css = {height:'', overflow:'initial'}
				$body.css(css);
				$contentWrap.css(css);
				jQuery('#mobilemenu')
					.fadeOut('fast', function(){
						jQuery(this).remove();
					});

				return true;
			}
			jQuery('button#mobileMenuCloseButton', $mobileMenu).on('mousedown touchdown', function(e){
				e.preventDefault();
				e.stopPropagation();
				window.removeEventListener('resize', dismissMenu)
				if (that.hasOrientationChange) window.removeEventListener('orientationchange', dismissMenu)
				dismissMenu();
				return false;
			});

			if (that.hasOrientationChange) window.addEventListener('orientationchange', dismissMenu)
			window.addEventListener('resize', dismissMenu)

			$mobileMenu.fadeIn('fast');
			jQuery('a', $mobileMenu).on('mousedown touchdown', dismissMenu)
			VizorUI.enableScrollToLinks($mobileMenu);

			return false;
		});

	}


	// check if device resembles touch-capable.
	this.isTouchCapable = function() {
	  return !!('ontouchstart' in window);
	};

	this.disableForceTouch = function() {
		$('body').on('webkitmouseforcewillbegin webkitmouseforcedown webkitmouseforceup webkitmouseforcechanged', function(e){
            e.preventDefault()
            e.stopPropagation()
            return false
        })
	}

	this.isFullScreen = function() {
		return !!(document.mozFullScreenElement || document.webkitFullscreenElement)
	}

	this.isInIframe = function() {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	}

	this.isInVR = function() {
		if (E2 && E2.core && E2.core.webVRManager && E2.core.webVRManager.isVRMode)
			return E2.core.webVRManager.mode === 3
		return false
	}

	/**
	 * tags document.body with mobile|nonmobile and portrait|landscape classes. invoked at start
	 */
	this.tagBodyClass = function() {
		var $body = jQuery('body');

		var isBrowser = VizorUI.isBrowser
		$body
			.toggleClass('uaSafari', isBrowser.Safari())
			.toggleClass('uaFirefox', isBrowser.Firefox())
			.toggleClass('uaChrome', isBrowser.Chrome())
			.toggleClass('uaEdge', isBrowser.Edge())

		$body
			.toggleClass('deviceDesktop', that.deviceIsDesktop)
			.toggleClass('deviceTablet', that.deviceIsTablet)
			.toggleClass('deviceMobile', that.deviceIsPhone)
			.toggleClass('inIframe', that.isEmbedded)
			.toggleClass('inVR', that.isInVR())

		var l = that.getLayoutMode();
		if (l !== that.lastLayout) {
			that.lastLayout = l;
			$body
				.toggleClass('layoutMobile',  l === 'mobile')
				.toggleClass('layoutTablet',  l === 'tablet')
				.toggleClass('layoutDesktop', l === 'desktop')
		}

		// because of how .isPortraitLike() works on Android, this needs a delay
		function tagLandscapeOrPortrait() {
			var o = that.isPortraitLike();
			if (o !== that.lastPortrait) {
				that.lastPortrait = o
				$body
					.toggleClass('portrait', o)
					.toggleClass('landscape', !o);
			}
		}

		if (VizorUI.isMobile.Android())
			setTimeout(tagLandscapeOrPortrait, 300)
		else
			tagLandscapeOrPortrait()

		return true;
	};

	// check if orientation resembles portrait
	this.isPortraitLike = function() {
		if (VizorUI.isMobile.Android()) {
			// http://stackoverflow.com/questions/30753522/chrome-43-window-size-bug-after-full-screen
			// https://www.sencha.com/forum/showthread.php?303224-Wrong-orientation-for-Galaxy-Tab-devices
			return window.innerWidth <= window.innerHeight
		}
		// http://caniuse.com/#search=matchmedia
		var mql = window.matchMedia("(orientation: portrait)");
		return mql.matches;
	};

	this.isDevicePhone = function() {
		var ua = navigator.userAgent
		var matchiOS = !!ua.match(/iPhone|iPod/i)
		var matchMobile = !!ua.match(/Mobile/i)
		return matchMobile && (matchiOS || !this.isDeviceTablet())
	}

	this.isDeviceTablet = function() {
		var ua = navigator.userAgent

		var matchAndroid 	= !!ua.match(/Android/i)
		var matchMobile 	= !!ua.match(/Mobile/i)
		var matchiPad 		= !!ua.match(/iPad/i)

		return matchiPad || (matchAndroid && !matchMobile)
	}

	this.isDeviceDesktop = function() {
		// match OS
		var ua = navigator.userAgent
		var matchOS = !!ua.match(/Windows|Mac OS X|Linux/i)
		return matchOS && !(this.isDevicePhone() || this.isDeviceTablet())
	}

	this.getLayoutMode = function() {	// note, match css!
		if (this.isInIframe()) return 'default'
		if (this.mqMobile.matches)
			return 'mobile';
		else if (this.mqTablet.matches)
			return 'tablet';
		else if (this.mqDesktop.matches)
			return 'desktop';
		else
			return 'default'
	};

	this.isModalOpen = function() {
		var $modal = jQuery('div.bootbox.modal');
		that.lastModalIsOpen = $modal.hasClass('in');
		return that.lastModalIsOpen
	}

	this.deviceIsTablet = this.isDeviceTablet()
	this.deviceIsPhone = this.isDevicePhone()
	this.deviceIsDesktop = this.isDeviceDesktop()
	this.isEmbedded = this.isInIframe()

	this.lastModalIsOpen = false
}

siteUI.formatFileSize = function(size) {	// bytes
	if (isNaN(size) || (size < 0)) return size

	if (size < 1024)
		return size + ' bytes'

	size = size / 1024

	if (size < 1000)
		return Math.round(size) + ' kB'

	size = size / 1024

	if (size < 1000)
		return size.toFixed(1) + ' MB'

	size = size / 1024

	return size.toFixed(2) + ' GB'
}

jQuery('document').ready(siteUI.init);

if (typeof VizorUI === 'undefined') var VizorUI = {};

VizorUI.makeVRCanvasResizeHandler = function($playerCanvas, $containerRef) {
	if (typeof $containerRef === 'undefined') {
		msg("ERROR: - using window for $containerRef");
		$containerRef = jQuery(window);
	}
	var oldPixelRatioAdjustedWidth = 0, oldPixelRatioAdjustedHeight = 0
	var oldFullscreen = null

	return function() {
		var width = $containerRef.innerWidth()
		var height = $containerRef.innerHeight()
		var devicePixelRatio = window.devicePixelRatio || 1;
		var pixelRatioAdjustedWidth = devicePixelRatio * width;
		var pixelRatioAdjustedHeight = devicePixelRatio * height;

		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement)

		if ((oldPixelRatioAdjustedWidth === pixelRatioAdjustedWidth) &&
			(oldPixelRatioAdjustedHeight === pixelRatioAdjustedHeight) &&
			(oldFullscreen === isFullscreen))
			return true

		if (pixelRatioAdjustedWidth * pixelRatioAdjustedHeight === 0) return true	// vr manager interstitial

		if (isFullscreen) {
			$playerCanvas
				.removeClass('webgl-canvas-normal')
				.addClass('webgl-canvas-fs');
			$containerRef
				.removeClass('webgl-container-normal')
				.addClass('webgl-container-fs');
		} else {
			$playerCanvas
				.removeClass('webgl-canvas-fs')
				.addClass('webgl-canvas-normal');
			$containerRef
				.removeClass('webgl-container-fs')
				.addClass('webgl-container-normal');
		}

		$playerCanvas
			.width(pixelRatioAdjustedWidth)
			.height(pixelRatioAdjustedHeight);

		E2.core.emit('resize')

		oldPixelRatioAdjustedWidth = pixelRatioAdjustedWidth
		oldPixelRatioAdjustedHeight = pixelRatioAdjustedHeight
		oldFullscreen = isFullscreen

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

VizorUI.openLoginModal = function(dfd) {
	if (E2 && E2.controllers && E2.controllers.account)
		return E2.controllers.account.openLoginModal(dfd)
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
VizorUI.modalOpen = function(html, heading, className, onEscape, opts) {
	onEscape = (typeof onEscape !== 'undefined') ? onEscape : true;
	opts = opts || {}
	opts.message = html;
	opts.onEscape = onEscape;
	if (typeof opts.backdrop === 'undefined') opts.backdrop = onEscape;	// bb 4.4+
	if ((typeof heading !== 'undefined') && heading) opts.title = heading;
	if ((typeof className !== 'undefined') && className) opts.className = className;
	var b = bootbox.dialog(opts);

	var trackModalStatus = function(){siteUI.isModalOpen(); return true}
	b
		.on('hidden.bs.modal', trackModalStatus)
		.on('shown.bs.modal', trackModalStatus)

	return b
};

VizorUI.modalClose = function(bb) {
	if (typeof bb !== 'undefined') bb.modal('hide');
	else bootbox.hideAll();
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

VizorUI.isBrowser = {
	WebKit: function () {
		return !!navigator.userAgent.match(/AppleWebKit/)
	},
	Gecko: function () {
		return !!navigator.userAgent.match(/Gecko/)
	},
	Firefox: function () {
		return !!navigator.userAgent.match(/Firefox/)
	},
	Chrome: function () {
		return (!!navigator.userAgent.match(/Chrome/)) || (!!navigator.userAgent.match(/CriOS/))
	},
	Safari: function () {
		return !!navigator.userAgent.match(/Safari/)
	},
	Edge: function () {
		return !!navigator.userAgent.match(/Edge/)
	}
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

		$form.not('.keepMessage')
			.removeClass('hasMessage')
			.addClass('noMessage')

		$form.find('p.xhr.success.message').remove();
		$form.find('span.message').html('');
		$form.find('div.form-input').removeClass('error');

		var $unknownError = jQuery('#unknown_error', $form);
		if ($unknownError.length < 1) $unknownError = jQuery('.genericError', $form);

		if (!$form.hasClass('keepMessage'))
			$unknownError.html('').hide();
		
		inProgress = true;
		$body.addClass('loading');
		$form.addClass('loading');

		jQuery.ajax({
			type:	'POST',
			url:	actionURL,
			data:	formData,
			dataType: 'json',
			error: function(err) {
				inProgress = false;
				var detail = {}
				$body.removeClass('loading');
				$form.removeClass('loading');
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
					detail = {
						errors: errors,
						json: json
					}
				} else {
					if (err.status === 200) {	// the response was deemed an error but has good status (jQuery timeout / last resort)
						$unknownError.html('<span>The server said: (' + err.status + '): ' + err.statusText +'</span>').show();
					} else {
						// in case no json comes back, e.g. just a code
						$unknownError.html('<span>An error ('+err.status+') occurred. Please check all required fields</span>').show();
					}
					detail = {
						err: err
					}
				}
				$form[0].dispatchEvent(new CustomEvent('xhrerror', {detail:detail}))
				$form
					.removeClass('noMessage')
					.addClass('hasMessage')
			},
			success: function() {
				inProgress = false;
				$body.removeClass('loading');
				onSuccess.apply(this,arguments);
			}

		});
		return false;
	});

	$form
		.data('xhrEnabled', true)
		.attr('data-xhrEnabled', 'true')

	$form
			.removeClass('hasMessage')
			.addClass('noMessage')
};

/**
 * replaces all svg buttons that have a data-svgref attribute,
 * if class .tiny also moving text from the content of the button to a popover tooltip
 * @param $selector jQuery
 * @returns {boolean} replaced any
 */
VizorUI.replaceSVGButtons = function($selector) {

	var numReplaced=0;
	$selector.find('button.svg[data-svgref!=""], a.btn.svg[data-svgref!=""]').each(function(){
		var $button = jQuery(this);
		var xref = $button.data('svgref');
		if (!xref) return;

		numReplaced++;
		var usehtml = "<use xlink:href='#"+ xref +"'></use>"	// browser won't parse this custom tag unless in svg
		var $svg = jQuery('<svg>'+usehtml+'</svg>');

		$button.data('svgref', false).attr('data-svgref','');

		if ($button.hasClass('tiny') && ($button.text() !== '')) {
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
	})

	function formatDate(date) {
		var mdate = moment(date)
		var now = moment(Date.now())
		
		if (mdate.isSame(now, 'd'))
			return moment(date).calendar()

		if (mdate.isSame(now, 'y'))
			return moment(date).format('MMM Do h:mm A')

		return moment(date).format('ll h:mm A')
	}

	var $updatedAt = $('.updatedAt', $card)
	var date = $updatedAt.text()
	$updatedAt.text(formatDate(date))

	return true;
}

VizorUI.toggleAccountDropdown = function() {
	if (VizorUI.userIsLoggedIn()) {
		jQuery('#userPullDown').toggle();
	}
	return false;
}

