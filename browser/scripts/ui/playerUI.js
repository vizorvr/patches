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
		vrInstructionsHidden: 'VRInstructionsHidden',
		loadingProgress		: 'progress',

		playerStateChanged	: 'player:stateChanged',
		playerPlaying		: 'player:playing'
    }
	var events = this.eventNames

	this.stage = 'beforeLoadingStage'

	var qs = document.querySelector.bind(document)
	this.dom = {
		'playBtn' : 		qs('#playButton'),
		'entervrBtn': 		qs('#entervr'),
		'fullscreenBtn' : 	qs('#fullscreen'),
		'editBtn':			qs('#edit'),
		'shareBtn':			qs('#sharebutton')
	}

	// jQuery
	this.$body = null
	this.$canvas = null
	this.$stage = null
	this.$wrap = null
	this.$header = null
	this.$controls = null

	// various state
	this.fadingIn = false
    this.headerIsVisible = true
    this.fadingOut = false
    this.overHeader = false
    this.overControls = false
    this.headerQueueFadeoutEnabled = true

	this.fadeoutTimer = null

    this.vrCameraEnabled = true
    this.data = {}

    var loadingComplete = false
	var enforceStartMode = Vizor.autoplay && !siteUI.isInIframe()

	if (typeof(E2) !== 'undefined' && E2.util.isBrowser.Carmel && E2.util.isBrowser.Carmel()) {
		enforceStartMode = true
		Vizor.startMode = 3
	}

    this.onProgress = function(pct) {
        var progressNode = document.getElementById('progressbar')
        if (progressNode) progressNode.value = pct
        if (pct === 100) {
            // sometimes we're called twice
            if (loadingComplete)
            	return
            // loaded all assets
            that.$body.addClass('assetsLoaded')
            loadingComplete = true
        }
    }

	this._stylePlayButton = function() {
		var playBtn = this.dom.playBtn
		if (!playBtn) // tests
			return

		var playSpan = playBtn.querySelector('span')
		var isReadyStage = this.stage === 'readyStage'

		if (isReadyStage) {
			playSpan.innerText = 'Start'
		} else {
			playSpan.innerText = 'Play'
		}

		playBtn.classList.toggle('btn', isReadyStage)
		playBtn.classList.toggle('svg', !isReadyStage)

		var showButton = true
		if (this.stage === 'playingStage' || this.stage === 'loadingStage')
			showButton = false

		$(playBtn).toggle(showButton)
	}

	this.onPlayerStateChanged = function(newState) {
		var s = E2.app.player.state
		var $wrap = that.$wrap

		that.$body
			.toggleClass('playing', newState === s.PLAYING)
			.toggleClass('paused', 	newState === s.PAUSED)
			.toggleClass('stopped', newState === s.STOPPED)
			.toggleClass('loading', newState === s.LOADING)
			.toggleClass('ready',   newState === s.READY)

		that.setStageFromPlayerState(newState)
		that._stylePlayButton()

		if (newState === s.PLAYING) {
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
		} else {
			that.headerFadeIn()
			if (newState !== s.PAUSED) {
				var bgImage = $wrap[0].style.backgroundImage
				var storedImage = $wrap.attr('data-bgimage')
				if (storedImage && !bgImage) {
					$wrap[0].style.backgroundImage = storedImage
				}
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
	
		that._stylePlayButton()

		// allow 360 to redirect progressbar entirely
		E2.core.on(events.loadingProgress, 
			(Vizor.onProgress) ? Vizor.onProgress : that.onProgress)

		function completeLoading() {
            if (!that.controlsBound) {
                that.bindHeaderBehaviour()
                that.bindButtons()
                that.controlsBound = true
            }
        }

		E2.core.on('assetsLoaded', completeLoading)

		// provisions for chrome/android
		$body
			.on(events.vrInstructionsShown, function () {
				$canvas.hide()
			})
			.on(events.vrInstructionsHidden, function () {
				$canvas.show()
			})

		if (siteUI.hasOrientationChange && VizorUI.isMobile.any()) {
			function allowExtraHeightOnLandscape() {
				if (siteUI.isInIframe())
					return true
				
				// provisions for mobile
				setTimeout(function () {
					var h = window.innerHeight
					if (siteUI.isPortraitLike()) {
						$body.css({ height: h + 'px' })
						$wrap.css({ bottom: '0' })
					}
					else {
						// allow dragging the body to hide the top bar
						$body.css({ height: (1.1*h) + 'px' })
						$wrap.css({ bottom: (0.1*h) + 'px' })
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

			E2.core.webVRAdapter.enterVR()
            siteUI.tagBodyClass()
        }

		function share(e) {
			e.preventDefault()
			var data = {
				origin	: Vizor.origin,
				embedOrigin: Vizor.embedOrigin,
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

		// display the header temporarily, and for longer if over header
		function headerHandler(e) {
			if (['INPUT','TEXTAREA','BUTTON', 'SVG', 'USE'].indexOf(e.target.tagName) > -1 ) return true
			if (siteUI.isInVR() || siteUI.isDragging) return true
			if (siteUI.isModalOpen()) return true
			if (window.Vizor && (window.Vizor.disableHeaderClick || window.Vizor.noHeader )) return true

			if (e.defaultPrevented)
				return true

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

		document.body.addEventListener('touchend', headerHandler)
		document.body.addEventListener('mouseup', headerHandler)

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

		function onVRModeChanged(mode) {
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

		if (!window.WebVRConfig)
			window.WebVRConfig = {}
		
		this.controlsBound = false
		this.$body = $(document.body)
		this.$canvas = $('#webgl-canvas')
		this.$stage = $('#playingStage')
		this.$wrap = $('#playerWrap')
		this.$header = $('#topbar')
		this.$controls = this.$header.find('div.controls').first()

		var $body = this.$body,
			$canvas = this.$canvas,
			$header = this.$header

		siteUI.disableForceTouch()
		VizorUI.replaceSVGButtons($header)

		$(window).on('unload', function () {})    // fix iOS frame js issues

		if (Vizor.isEmbedded && (!siteUI.isDeviceDesktop()) && !siteUI.isInIframe()) {
			$('button#fullscreen').hide()
		}

        $('#playButton').on('click', that.onPlayButtonClicked.bind(that))

        if (Vizor.autoplay)
            $body.addClass('autoplay')
        else
            $body.addClass('paused')

    	this.headerIsVisible = !Vizor.noHeader

        if (!Vizor.noHeader)
	        this.headerFadeIn()
    }
}

// can be overridden (threesixty.js)
VizorPlayerUI.headerDefaultFadeoutTimeMs = 2500

VizorPlayerUI.prototype.displayVRPlayerUrl = function() {
	var url = (window.Vizor && Vizor.shareURL) ? Vizor.shareURL : window.location.href
	var niceurl = url.replace(/^(http)s?:\/\//i, '')
	this.headerFadeOut()
	return VizorUI.modalOpen("<a href='" + url + "'>" + niceurl + "</a>", 'View in VR on your phone', 'viewinvr')
}

VizorPlayerUI.prototype.onPlayButtonClicked = function() {
	var that = this

	switch(this.stage) {
		case 'beforeLoadingStage':
			window.playVizorFile()
			.catch(function(err) {
				console.error(err.stack)
				var $err = that.selectStage('errorStage')
				$err.html(err)
			})
			break;

		case 'readyStage':
			E2.app.player.play()
			break;
	}
}

VizorPlayerUI.prototype.setStageFromPlayerState = function(playerState) {
	var newStage = 'errorStage'
	var state = E2.app.player.state

	switch(playerState) {
		case state.READY:
			newStage = 'readyStage'
			break;
		case state.PLAYING:
			newStage = 'playingStage'
			E2.track({
				event: 'playerPlaying'
			})
			break;
		case state.PAUSED:
		case state.STOPPED:
			newStage = 'readyStage'
			break;
		case state.LOADING:
			newStage = 'loadingStage'
			break;
	}

	this.selectStage(newStage)
}

VizorPlayerUI.prototype.selectStage = function(stageName) {
	if (stageName === this.stage)
		return;

	var $body = this.$body

	this.stage = stageName

	var wrap = $('#playerWrap')
	wrap
		.find('div.stage')
		.removeClass('front')

	wrap
		.find('#' + stageName)
		.addClass('front')

	switch (stageName) {
		case 'readyStage':
			$body.addClass('paused')
			break;
		case 'playingStage':
			$body.removeClass('paused')
			$body.addClass('playing')
			break;
	}
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
	this.fadeoutTimer = setTimeout(this.headerFadeOut.bind(this), timeoutMs || VizorPlayerUI.headerDefaultFadeoutTimeMs)
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
	if (this.fadingIn)
		return

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

var playerUI
$(window).on('vizorLoaded', function() {
	playerUI = new VizorPlayerUI()

	if (have_webgl) {
		playerUI.init()
		playerUI.onPlayerLoaded()
		$(window).trigger('playerUiReady')
	} else {
		var $err = playerUI.selectStage('errorStage')
		$err.html(E2.views.partials.noWebGL({embed: siteUI.isEmbedded}))
	}
})

if (typeof(module) !== 'undefined') {
	module.exports = VizorPlayerUI
}
