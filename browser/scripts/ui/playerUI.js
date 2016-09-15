var have_webgl = (function () {   // http://www.browserleaks.com/webgl#howto-detect-webgl
    if (!window.WebGLRenderingContext) return false;
    /* WebGL not supported*/
    var canvas = document.createElement("canvas"), names = ["webgl", "experimental-webgl", "moz-webgl"], gl = false;
    for (var i in names) {
        try {
            gl = canvas.getContext(names[i]);
            if (gl && typeof gl.getParameter == "function") { /* WebGL is enabled */
                return names[i];
                /* or return true; */
            }
        } catch (e) {
        }
    }
    return false;
    /* WebGL is supported, but disabled */
})();

var VizorPlayerUI = function() {
	var that = this
	this.eventNames = {
		controlsDisplayed	: 'controlsDisplayed',
		controlsHidden		: 'controlsHidden',

		vrInstructionsShown : 'VRInstructionsShown',
		vrInstructionsHidden : 'VRInstructionsHidden',
		playerLoaded		: 'vizorLoaded',
		loadingProgress		: 'progress',

		doneLoading			: 'assetsLoaded',
		playerStateChanged	: 'player:stateChanged',
		playerPlaying		: 'player:playing'
    }
	var events = this.eventNames

	// jQuery
	this.$body = null
	this.$canvas = null
	this.$stage = null
	this.$wrap = null
	this.$header = null
	this.$controls = null

	this.autoplay = true

	// various state
	this.fadingIn = false
    this.headerIsVisible = true
    this.fadingOut = false
    this.overHeader = false
    this.overControls = false
    this.headerQueueFadeoutEnabled = true

    this.headerDefaultFadeoutTimeMs = 2500
	this.fadeoutTimer = null

    this.vrCameraEnabled = true
    this.data = {}

    var loadingComplete = false
    this.onProgress = function(pct) {
        var progressNode = document.getElementById('progressbar')
        if (progressNode) progressNode.value = pct
        if (pct == 100) {
            // sometimes we're called twice
            if (loadingComplete) return
            // loaded all assets
            $('body').addClass('assetsLoaded')
            loadingComplete = true
        }
    }

	var enforceStartMode = this.autoplay && !siteUI.isInIframe()
	this.onPlayerStateChanged = function(newState, old) {
		var s = E2.app.player.state
		var $wrap = that.$wrap

		that.$body
			.toggleClass('playing', newState === s.PLAYING)
			.toggleClass('paused', 	newState === s.PAUSED)
			.toggleClass('stopped', newState === s.STOPPED)
			.toggleClass('loading', newState === s.LOADING)

		if (newState === s.PLAYING) {
			that.selectStage('stage')
			E2.core.webVRAdapter.resizeToTarget()
			that.queueHeaderFadeOut()
			if (Vizor.startMode && enforceStartMode) {
				enforceStartMode = false
				E2.core.webVRAdapter.setMode(Vizor.startMode)
			}
			var bgImage = $wrap[0].style.backgroundImage
			if (bgImage) {
				$wrap.attr('data-bgimage', bgImage)
				$wrap[0].style.backgroundImage = ''
			}
		}
		else {
			that.headerFadeIn()
			if (newState !== s.PAUSED) {
				var bgImage = $wrap[0].style.backgroundImage
				var storedImage = $wrap.attr('data-bgimage')
				if (storedImage && !bgImage) {
					$wrap[0].style.backgroundImage = storedImage
				}
				that.selectStage('none')
			}
		}


	}

	this.onPlayerLoaded = function() {
		var $canvas = that.$canvas,
			$stage = that.$stage,
			$body = that.$body,
			$wrap = that.$wrap

		E2.core.on(events.playerStateChanged, that.onPlayerStateChanged)

		E2.app.isVRCameraActive = function () {
			if (siteUI && siteUI.lastModalIsOpen) return false
			return that.vrCameraEnabled && !(that.overHeader || that.overControls)
		}

		E2.app.calculateCanvasArea = function () {
			return {
				width: 	$stage.innerWidth(),
				height: $stage.innerHeight()
			}
		}

		that.enableVRcamera()

		// allow 360 to redirect progressbar entirely
		var progress = (window.Vizor && window.Vizor.onProgress) ? window.Vizor.onProgress : that.onProgress
		E2.core.on(events.loadingProgress, progress)

		function completeLoading() {
            that.selectStage('stage')
			E2.track({
				event: 'playerPlaying'
			})

            if (!that.controlsBound) {
                that.bindHeaderBehaviour()
                that.bindButtons()
                that.controlsBound = true
            }
        }

		E2.core.on(events.doneLoading, completeLoading)

		// provisions for chrome/android
		$body
			.on(events.vrInstructionsShown, function () {
				$canvas.hide()
			})
			.on(events.vrInstructionsHidden, function () {
				$canvas.show()
			})

		if (siteUI.hasOrientationChange
			&& VizorUI.isMobile.any()
		) {
			var allowExtraHeightOnLandscape = function () {
				if (siteUI.isInIframe())
					return true
				
				// provisions for mobile
				setTimeout(function () {
					var h = window.innerHeight
					if (siteUI.isPortraitLike()) {
						$body.css({
							height: h + 'px'
						})
						$wrap.css({
							bottom: '0'
						})
					}
					else {
						$body.css({
							height: (1.1*h) + 'px'  // allow dragging the body to hide the top bar
						})
						$wrap.css({
							bottom: (0.1*h) + 'px'
						})
					}
				}, 500)
			}

			$(window).on('orientationchange', allowExtraHeightOnLandscape)
			allowExtraHeightOnLandscape()
		}
	}

	this.bindButtons = function() {
		function enterFullscreen(e) {
			E2.track({ event: 'enterFullscreen' })
			E2.core.webVRAdapter.enterFullscreen()
            siteUI.tagBodyClass()
        }

        function enterVR(e) {
			E2.track({ event: 'enterVR' })

            if (siteUI.isDeviceDesktop() && !E2.core.webVRAdapter.isVRCompatible()) {
                // display "view in VR" sign
                return that.displayVRPlayerUrl(that.data.shareURL)
            }
			// else
			E2.core.webVRAdapter.enterVR()
            siteUI.tagBodyClass()
        }

		function share(e) {
			e.preventDefault()
			var data = {
				origin	: Vizor.origin,
				shareURL : Vizor.shareURL,
				embedSrc : Vizor.embedSrc
			}
			that.suspendVRcamera()
			that.headerFadeOut(200)
			VizorUI.graphShareDialog(data, {onEscape: that.enableVRcamera})
			
			return false
		}

		function edit(e) {
			var editUrl = '/' +
				window.location.href
				.split('?')[0]
				.split('/')
				.join(' ')
				.trim()
				.split(' ')
				.slice(-2)
				.concat('edit')
				.join('/')

			window.location = editUrl
		}


		$('#fullscreen, #entervr, #sharebutton, #edit').off('click')
		$('#edit').click(edit)
        $('#fullscreen').on('click', enterFullscreen)
        $('#entervr').on('click', enterVR)
		$('#sharebutton').on('click', share)

		var firstMouseDown = true

		that.$canvas.on('mousedown touchstart', function() {
			if (firstMouseDown) {
				firstMouseDown = false
				E2.track({ event: 'mouseDownInPlayer' })
			}
		})
	}

	this.bindHeaderBehaviour = function() {
		var $body = that.$body,
			$controls = that.$controls,
			$header = that.$header
		var headerHandler = function(e) {  // display the header temporarily, and for longer if over header

			if (['INPUT','TEXTAREA','BUTTON', 'SVG', 'USE'].indexOf(e.target.tagName) > -1 ) return true
			if (siteUI.isInVR() || siteUI.isDragging) return true
			if (siteUI.isModalOpen()) return true
			if (window.Vizor && (window.Vizor.disableHeaderClick || window.Vizor.noHeader )) return true

			if (!that.headerIsVisible) {
				if (e.touches) {
					e.stopPropagation()
					e.preventDefault()
				}
				that.headerFadeIn()
				that.queueHeaderFadeOut()
			} else {
				that.queueHeaderFadeOut(100, true)  // give any button some time to react
			}

			return true
		}
		// dibs on these
		document.body.addEventListener('touchend', headerHandler, true)
		document.body.addEventListener('mouseup', headerHandler, true)

		// track mouse hover on header
		$controls
			.on('mouseenter', function () {
				that.overControls = true
				if (!siteUI.isDragging) {
					that.clearFadeoutTimer()
					that.headerFadeIn()
				}
			})
			.on('mouseleave', function () {
				that.overControls = false
				that.queueHeaderFadeOut()
			})

		$body
			.on(events.vrInstructionsShown, function () {
				$header.hide()
				that.fadingIn = that.fadingOut = false
			})
			.on(events.vrInstructionsHidden, function () {
				that.fadingIn = that.fadingOut = false
				if (siteUI.isPortraitLike()) {
					that.headerFadeIn()
					that.queueHeaderFadeOut()
				}
			})

		var onVRModeChanged = function(mode, oldMode) {
			siteUI.tagBodyClass()
			if (mode !== 3) {
				that.overHeader = false
				that.overControls = false
				that.fadingOut = false
				that.fadingIn = false
			}
			var modes = E2.core.webVRAdapter.modes
			switch (mode) {
				case modes.VR:
					if (that.headerIsVisible)
						that.headerFadeOut(10)
					break
				case modes.MAGIC_WINDOW:
					if (that.headerIsVisible)
						that.headerFadeOut()
					break
				case modes.NORMAL:
					that.headerFadeIn()
					that.queueHeaderFadeOut()
					break
			}
		}

		var w = E2.core.webVRAdapter
		w.on(w.events.modeChanged, onVRModeChanged)

		setTimeout(function () {
			if (VizorUI.isMobile.any() && !siteUI.isPortraitLike())
				that.headerFadeOut()
			else
				that.queueHeaderFadeOut()
		}, 300)
	}

    this.init = function () {
		var that = this
		var events = this.eventNames

		if (!window.WebVRConfig) window.WebVRConfig = {}
		
		this.controlsBound = false
		this.$body = $(document.body)
		this.$canvas = $('#webgl-canvas')
		this.$stage = $('#stage')
		this.$wrap = $('#playerWrap')
		this.autoplay = this.$canvas.data('autoplay')
		this.$header = $('#topbar')
		this.$controls = this.$header.find('div.controls').first()

		var $body = this.$body,
			$canvas = this.$canvas,
			$header = this.$header

		siteUI.disableForceTouch()
		VizorUI.replaceSVGButtons($header)
		$(window).on('unload', function () {})    // fix iOS frame js issues

		// /embed/user/graph?autoplay sent by boilerplate
		// (not on desktop and not in iframe and therefore already fullscreen so the button makes no sense)

		if (Vizor.isEmbedded && (!siteUI.isDeviceDesktop()) && !siteUI.isInIframe()) {
			$('button#fullscreen').hide()
		}

		// PLAYER LOADED
		// binds buttons, defines the header behaviour and other things
		$(window).on(events.playerLoaded, this.onPlayerLoaded.bind(this))

		// play button loads and plays so this is separate from the rest of header
        function preparePlay() {
            $body.addClass('paused')
            var $playButton = jQuery('#playButton')
            $playButton.on('click', that.play.bind(that))
        }

		if (Vizor.hasAudio && VizorUI.isMobile.iOS()) {
			Vizor.noHeader = false
			Vizor.autoplay = this.autoplay = false
		}

        if (this.autoplay)
            $body.addClass('autoplay')
        else
            preparePlay()

		// ready to show
        that.selectStage('loadingStage')

    	that.headerIsVisible = !Vizor.noHeader

        if (!Vizor.noHeader)
	        that.headerFadeIn()

    } // end .init()
}

VizorPlayerUI.prototype.displayVRPlayerUrl = function() {
	var url = (window.Vizor && Vizor.shareURL) ? Vizor.shareURL : window.location.href
	var niceurl = url.replace(/^(http)s?:\/\//i, '')
	this.headerFadeOut()
	return VizorUI.modalOpen("<a href='" + url + "'>" + niceurl + "</a>", 'View in VR on your phone', 'viewinvr')
}

VizorPlayerUI.prototype.selectStage = function(elementId) {
	var wrap = jQuery("#playerWrap")
	wrap
		.find('div.stage')
		.removeClass('front')

	return wrap
		.find('#' + elementId)
		.addClass('front')
}

VizorPlayerUI.prototype.suspendVRcamera = function() {
	this.vrCameraEnabled = false
}

VizorPlayerUI.prototype.enableVRcamera = function() {
	var that = this
	this.vrCameraEnabled = true

	var canMoveCamera = function(e){
		var isKeyboard = (e instanceof KeyboardEvent) && (e.target === document.body)
		var isCanvas = (!isKeyboard) && E2.util.isCanvasInFocus(e)
		return siteUI.isFullScreen() || that.vrCameraEnabled && (isKeyboard || isCanvas)
	}
	WebVRConfig.canInitiateCameraMove = canMoveCamera
	E2.app.canInitiateCameraMove = canMoveCamera
}

VizorPlayerUI.prototype.play = function() {
	this.selectStage('stage')
	playVizorFile()
		.catch(function (err) {
			var $err = that.selectStage('errorStage')
			$err.html(err)
		})
}

VizorPlayerUI.prototype.headerDisableAutoFadeout = function() {
	this.clearFadeoutTimer()
	this.headerQueueFadeoutEnabled = false
	this.headerFadeIn()
}

VizorPlayerUI.prototype.headerEnableAutoFadeout = function() {
	this.headerQueueFadeoutEnabled = true
}

VizorPlayerUI.prototype.clearFadeoutTimer = function () {
	clearTimeout(this.fadeoutTimer)
	this.fadeoutTimer = null
}

VizorPlayerUI.prototype.queueHeaderFadeOut = function(timeoutMs, forceIfAutoDisabled) {
	if (E2.app.player.current_state !== E2.app.player.state.PLAYING) return true
	if (!this.headerQueueFadeoutEnabled  &&  !forceIfAutoDisabled) return true
	if (!this.headerIsVisible) return
	if (siteUI.isInVR()) {
		this.$body.removeClass('withPlayerControls')
		this.$header.hide()
		this.headerIsVisible = false
	}
	if (this.fadeoutTimer) clearTimeout(this.fadeoutTimer)
	this.fadeoutTimer = setTimeout(this.headerFadeOut.bind(this), timeoutMs || this.headerDefaultFadeoutTimeMs)
	return true
}

VizorPlayerUI.prototype.headerFadeOut = function (duration) {
	duration = duration || 500
	if (this.fadingOut || !this.headerIsVisible) return
	if (siteUI.isInVR()) {
		this.$header.hide()
		return
	}
	var that = this
	this.fadingOut = true
	this.$body.removeClass('withPlayerControls')
	this.$header.fadeOut(duration, function () {
		that.fadingOut = false
		that.headerIsVisible = false
		that.overControls = false
		that.overHeader = false
	})
	return true
}

VizorPlayerUI.prototype.headerFadeIn = function () {
	if (this.fadingIn) return
	this.fadingIn = true
	this.clearFadeoutTimer()

	var that = this
	this.headerIsVisible = true
	this.$header.fadeIn(200, function () {
		that.fadingIn = false
		that.$body.addClass('withPlayerControls')
	})
	return true
}

var playerUI = new VizorPlayerUI()
document.addEventListener('DOMContentLoaded', function(){
	if (have_webgl) {
		playerUI.init()
	} else {
		var $err = playerUI.selectStage('errorStage')
		$err.html(E2.views.partials.noWebGL({embed: siteUI.isEmbedded}))
	}
})