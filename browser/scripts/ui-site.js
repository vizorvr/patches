// requires bootbox
if (typeof msg === 'undefined')
	var msg = function(msg) {console.error(msg)};

if (typeof VizorUI === 'undefined')
	var VizorUI = {}

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

	var _isDragging = null	// fallback when no E2.ui, e.g. on site
	Object.defineProperty(this, 'isDragging', {
		get: function() {
			if (E2 && E2.ui && E2.ui.isDragging) {
				_isDragging = E2 && E2.ui && E2.ui.isDragging()
			}
			return _isDragging
		},
		set: function(v) {
			_isDragging = v
			if (E2 && E2.ui && E2.ui.setDragging)
				E2.ui.setDragging(v)
			return v
		}
	})

	this.onResize = function() {
		that.tagBodyClass();
		return true;
	};

	this.attach = function() {

		var $body = jQuery('body');
		this._setupDragRecognition()

		window.addEventListener('resize', this.onResize, true)

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

		Array.prototype.forEach.call(
			document.body.querySelectorAll('[data-hideshow-target]'),
			VizorUI.hideshow)

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

		// default if the signup form ever gets hit on a static page
		var signupCallback = function() {
			window.location.href = '/account';
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
		that.tagBodyClass()
		that.attach()

		if (jQuery('body.bHome.bIndex').length > 0) {
			that.initHomepage()
		}
		else if (jQuery('body.bHome.bAbout').length > 0) {
			that.initAbout()
		}
		// auto popovers
		$('[data-toggle="popover"]').popover()

	}

	this.initCollapsible = function($container) {
		var $links = jQuery('a.trigger', $container)
		$links.on('click',
			function(e){
				if (this.href.split('#').length <= 1) return true	// not for us
				e.preventDefault()
				e.stopPropagation()

				var anchor = '#'+ this.href.split('#')[1]
				var $target = jQuery(anchor)
				var $a = jQuery(this)

				var wasVisible = $target.is(':visible')
				if (wasVisible) {
					$target
						.slideUp('medium', function(){
							jQuery(this)
								.removeClass('uncollapsed')
								.addClass('collapsed')
								.css({margin: '0'})
						})
				} else {
					$target
						.hide()
						.removeClass('collapsed')
						.addClass('uncollapsed')
						.slideDown('medium')
				}

				$a
					.toggleClass('closed', wasVisible)
					.toggleClass('open', !wasVisible)
				return false
			})
		$links.each(function(){
			var anchor = '#'+ this.href.split('#')[1]
			var $target = jQuery(anchor)
			$target.hide()
		})
	}

	this.initHome = function($body) {
		$body = $body || jQuery('body')
		jQuery('a#homeSignin', $body).on('click', function(e) {
			e.preventDefault()
			e.stopPropagation()
			VizorUI.openLoginModal()
			.then(function(){
				document.location.href="/account"
			})
			return false
		})

		jQuery('a#homeSignup', $body).on('click', function(e) {
			e.preventDefault()
			e.stopPropagation()
			VizorUI.openSignupModal()
			.then(function(){
				document.location.href="/edit"
			})
			return false
		})

		$('.team-member').click(function() {
			window.open($(this).find('.profile-link').attr('href'));
		})
		$('.team-button').click(function(e) {
			var teamY = $window.height();
			$("html, body").animate({scrollTop: teamY}, 500);
			e.preventDefault();
			return false;
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

			if (that.hasOrientationChange)
				window.addEventListener('orientationchange', dismissMenu)
			window.addEventListener('resize', dismissMenu)

			$mobileMenu.fadeIn('fast');
			jQuery('a', $mobileMenu).on('mousedown touchdown', dismissMenu)
			VizorUI.enableScrollToLinks($mobileMenu);

			return false;
		});

		VizorUI.replaceSVGButtons($('#contentwrap'))
	}

	this.initAbout = function($body) {
		E2.track({ event: 'aboutPage' })
		this.initHome()
	}

	this.initHomepage = function($body) {
        E2.track({ event: 'frontPage' })
		this.initHome()

		var $homePlayerContainer = jQuery('#player_home');
		
		$(window).on('vizorLoaded', function() {
			// E2.app.canInitiateCameraMove = function(){return false};	// disable panning on homepage player, see #790
			E2.app.calculateCanvasArea = function() {
                return{
                    width: $homePlayerContainer.innerWidth(),
                    height: $homePlayerContainer.innerHeight()
                }
            }

			// WebVRConfig.canInitiateCameraMove = E2.app.canInitiateCameraMove // see above
			WebVRConfig.getContainerMeta = E2.app.calculateCanvasArea
		});


		var ms = []
		var switchSlides = function(e){
			var m
			if (e.detail.layout === 'mobile') {
				if (ms.length > 0) {
					while (m = ms.pop()) {
						m.detach()
					}
				}
				var content = document.getElementById('featuredVR').querySelectorAll('div.mobileslides')
				Array.prototype.forEach.call(content, function(div){
					var m = new Minislides(div,  {
						slideQuery:':scope>article',
						slideContainerQuery:'.side-by-side',
						transitionMethod: 'horizontal'}
					)
					ms.push(m)
				})

			} else {
				if (ms.length > 0) {
					while (m = ms.pop()) {
						m.detach()
					}
				}
			}
		}.bind(this)

		document.addEventListener('uiLayoutChanged', switchSlides)
		if (this.getLayoutMode() === 'mobile')
			switchSlides({detail:{layout:'mobile'}})

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
		return (E2 && E2.core && E2.core.webVRAdapter && E2.core.webVRAdapter.isVRMode && E2.core.webVRAdapter.isVRMode())
	}

	/**
	 * tags document.body with mobile|nonmobile and portrait|landscape classes. invoked at start
	 */
	this.tagBodyClass = function() {
		var $body = jQuery('body');

		var devicePixelRatio = window.devicePixelRatio || 1

		var isBrowser = E2.util.isBrowser
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
			.toggleClass('inVR', !!that.isInVR())

		$body.attr('data-dpr', devicePixelRatio)

		var l = that.getLayoutMode();
		if (l !== that.lastLayout) {
			$body
				.toggleClass('layoutMobile',  l === 'mobile')
				.toggleClass('layoutTablet',  l === 'tablet')
				.toggleClass('layoutDesktop', l === 'desktop')
			document.dispatchEvent(new CustomEvent('uiLayoutChanged', {detail:{layout: l, lastLayout: that.lastLayout}}))
			that.lastLayout = l;
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

		if (E2.util.isMobile.Android())
			setTimeout(tagLandscapeOrPortrait, 300)
		else
			tagLandscapeOrPortrait()

		return true;
	};

	// check if orientation resembles portrait
	this.isPortraitLike = function() {
		if (E2.util.isMobile.Android()) {
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

/***** MODAL LAYER *****/
VizorUI.modalOpen = function(html, heading, className, onEscape, opts) {
	opts = _.extend({
		title: heading,
		className : className,
		onEscape: (typeof onEscape !== 'undefined') ? onEscape : true
	}, opts)

	opts.message = html	// always overwrite
	if (typeof opts.backdrop === 'undefined')
		opts.backdrop = opts.onEscape	// bb 4.4+

	var modal = bootbox.dialog(opts)

	var trackModalStatus = function() {
		siteUI.isModalOpen()
		return true
	}

	modal
		.on('hidden.bs.modal', trackModalStatus)
		.on('shown.bs.modal', trackModalStatus)

	return modal
}

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



VizorUI.growl = function(message, type, duration, user) {
	type = type || 'info'
	duration = 500 + (duration || 2000)			// account for reveal animations

	var fromUser = _.extend({
		username: '',
		color: 'transparent',
		firstLetter: '',
		gravatar: ''
	}, user)

	if (fromUser.username) {
		fromUser.firstLetter = fromUser.username.charAt(0)
	}

	var data = {
		type: type,
		fromUser: fromUser,
		message: message
	}

	var $notificationArea = jQuery('#notifications-area')
	if (!$notificationArea.length) {
		$notificationArea = jQuery('<div id="notifications-area"></div>')
		jQuery('body').append($notificationArea)
	}

	var $notification = jQuery(E2.views.partials.notification(data))

	var remove = function () {
		$notification.remove()
		if (jQuery('>div', $notificationArea).length === 0) {
			$notificationArea.remove()
		}
	}

	var close = function() {
		$notification.removeClass('notification-show').addClass('notification-hide')
		setTimeout(remove, 1000)
	}

	$notificationArea.append($notification)
	$notification.addClass('notification-show')

	setTimeout(close, duration * $('.notification', $notificationArea).length)

	return $notification
}

VizorUI.notifyBySite = function(text, timeout) {
	return VizorUI.growl(text, 'notify-site', timeout || 2000)
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
 * replaces all svg buttons that have a data-svgref attribute,
 * if class .tiny also moving text from the content of the button to a popover tooltip
 * @param $selector jQuery
 * @returns {boolean} replaced any
 */
VizorUI.replaceSVGButtons = function($selector) {

	var numReplaced=0;
	$selector.find('button.svg[data-svgref!=""], a.svg[data-svgref!=""]').each(function(){
		var $button = jQuery(this);
		var xref = $button.data('svgref');
		if (!xref) return;

		numReplaced++;
		var usehtml = "<use xlink:href='#"+ xref +"'></use>"	// browser won't parse this custom tag unless in svg
		var $svg = jQuery('<svg>'+usehtml+'</svg>');

		$button.data('svgref', false).attr('data-svgref','');

		if ($button.hasClass('tiny') && ($button.text() !== '')) {
			if (!$button.hasClass('nopopup')) {
				$button.popover({
					content: $button.text(),
					delay: {
						show: 750,
						hide: 100
					},
					placement: 'auto top',
					trigger: 'hover'
				})

				$button.click(function(){
					$button.popover('hide')
				})
			} else {
				if (!$button.attr('title'))
					$button.attr('title', $button.text())
			}
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
 * makes an element hide or show on trigger click
 * @example <button data-hideshow="hide" data-target="hstarget">click</button><div id="hstarget">...</div>
 * @param triggerEl
 * @emits hideshow:changed on triggerEl when its visibility changes
 */
VizorUI.hideshow = function(triggerEl) {
	if (triggerEl.hideshow)
		triggerEl.removeEventListener('click', triggerEl.hideshow._listener)

	var initialState = triggerEl.dataset['hideshow']
	triggerEl.hideshow = {
		set : function(state) {
			this.visible = (state === 'show')
		},
		toggle : function() {
			this.visible = !this.visible
		},
		get default() {
			return initialState
		},
		get target() {
			return document.getElementById(triggerEl.dataset['hideshowTarget'])
		},
		get visible() {
			return this.target.dataset['hideshow'] === 'show'
		},
		set visible(v) {
			var target = this.target
			target.dataset['hideshow'] = triggerEl.dataset['hideshow'] = v ? 'show' : 'hide'
			target.dispatchEvent(new CustomEvent('hideshow:changed', {detail:{visible: this.visible, trigger: triggerEl}}))
			return !!v
		},
		_listener : function(e) {
			e.preventDefault()
			e.currentTarget.hideshow.toggle()
		}
	}

	triggerEl.hideshow.set(initialState)
	triggerEl.addEventListener('click', triggerEl.hideshow._listener)
}

/**
 * wires up svg buttons on asset card to fire events as per assetUIEvent
 * @param $card
 */
VizorUI.setupAssetCard = function($card) {

	var dispatchAction = function(e){
		var $this = jQuery(e.currentTarget)
		$card = $this.parents('article.asset.card').first()
		if (!$card) return true
		var detail = {
			id: 	$card.data('objectid'),
			url: 	$card.data('url'),
			type: 	$card.data('asset-type'),
			action:	$this.data('action'),
			triggeredByEl: e.currentTarget
		}
		var eventName = detail.type + '.' + detail.action	// e.g. graph.open, project.delete
		var cardEvent = new CustomEvent(eventName, {detail: detail})
		document.dispatchEvent(cardEvent)
		return true
	}

	VizorUI.replaceSVGButtons($card);

	jQuery('button', $card).off('.assetUI');	// remove just us from all buttons

	jQuery('button.action', $card).on('click.assetUI', dispatchAction)
	jQuery('input[type=checkbox]', $card).on('change.assetUI', dispatchAction)

	return true
}

// returns a promise for a confirmation dialog
VizorUI.requireConfirm = function(message) {
	return new Promise(function(resolve, reject){
		if (confirm(message || 'please confirm?'))
			resolve()
		else
			reject()
	})
}

VizorUI.toggleAccountDropdown = function() {
	if (VizorUI.userIsLoggedIn()) {
		jQuery('#userPullDown').toggle()
	}
	return false
}

/**
 * data : {	origin:		Vizor.origin,		e.g. http://localhost:8000
 * 			shareURL : 	Vizor.shareURL,		e.g. http://localhost:8000/eesn/flamingofront
 * 			embedSrc : 	Vizor.embedSrc		e.g. http://localhost:8000/embed/eesn/flamingofront
 * 		   }
 */
VizorUI.graphShareDialog = function(data, opts) {
	data.autoplay = true
	data.noHeader = false
	opts = _.extend({
		title: "Share this"
	}, opts)

	var html = E2.views.partials.playerShareDialog(data)
	var modal = VizorUI.modalOpen(html, opts.title, 'player_share doselect_all', undefined, opts)
	modal
		.find('textarea, input')
		.on('mouseup touchup', function (e) {
			e.currentTarget.select()
			e.currentTarget.setSelectionRange(0, 9999)
			e.preventDefault()
			return true
		})
		.on('focus', function (e) {
			e.preventDefault()
			e.stopPropagation()
			return false
		})

	siteUI.initCollapsible(modal)
	return modal
}


VizorUI.renderGraphTile = function(tileData, withActions, withAllActions) {
	var data = _.extend(_.cloneDeep(tileData), {
			withActions:withActions,
			allowAllActions: withAllActions
		})
	return E2.views.partials.assets.graphCard(data)
}


jQuery('document').ready(function(){
	if (!window)
		return
	window.VizorUI.isMobile = E2.util.isMobile
	window.VizorUI.isBrowser = E2.util.isBrowser
	siteUI.init()
})
