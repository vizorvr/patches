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
	this.eventNames = {
        controlsDisplayed : 'controlsDisplayed',
        controlsHidden :    'controlsHidden',
        vrModeChanged :     'vrManagerModeChanged',
        vrInstructionsShown : 'VRManInstructionsShown',
        vrInstructionsHidden : 'VRManInstructionsHidden',
        playerLoaded :      'vizorLoaded',
        loadingProgress :   'progress',

        doneLoading :       'assetsLoaded',
        stateChanged :      'player:stateChanged'
    }

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

    this.init = function () {
		var that = this
		var events = this.eventNames
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
			$header = this.$header,
			$controls = this.$controls,
			$stage = this.$stage,
			$wrap = this.$wrap

        if (!window.WebVRConfig) window.WebVRConfig = {}
        WebVRConfig.getContainerMeta = function() {
            var el = document.getElementById('stage')
            var c = document.getElementById('webgl-canvas')
			var ret
            var fsel = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement
            if (fsel) {
                ret = {
                    element: c,
                    width :  window.innerWidth,
                    height : window.innerHeight
                }
            } else {
                var r = el.getBoundingClientRect()
                ret = {
                    element : el,
                    width   : r.width,
                    height  : r.height
                }
            }
			if (!ret.width || !ret.height) {
				console.error('adjusting dimensions')
				ret.width = 1
				ret.height = 1
			}
			return ret
        }

        VizorUI.replaceSVGButtons($header)
        siteUI.disableForceTouch()

        function bindHeaderBehaviour() {
            var headerHandler = function(e) {  // display the header temporarily, and for longer if over header

                if (['INPUT','TEXTAREA','BUTTON', 'SVG', 'USE'].indexOf(e.target.tagName) > -1 ) return true
                if (siteUI.isInVR() || siteUI.isDragging) return true
                if (siteUI.isModalOpen()) return true
                if (window.Vizor && window.Vizor.disableHeaderClick) return true

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
                    console.log('instructions shown!')
//                    bindVRBackButton()
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

            var onVRModeChanged = function(e) {
                var mode = e.detail.mode, oldMode = e.detail.oldMode
                if (mode !== 3) {
                    $body.removeClass('inVR')
                    that.headerIsVisible = false
                    that.overHeader = false
                    that.overControls = false
                    that.fadingOut = false
                    that.fadingIn = false
                    that.headerFadeIn()
                    that.queueHeaderFadeOut()
                }
            }
            $body[0].addEventListener(events.vrModeChanged, onVRModeChanged)

            setTimeout(function () {
                if (VizorUI.isMobile.any() && !siteUI.isPortraitLike())
                    that.headerFadeOut()
                else
                    that.queueHeaderFadeOut()
            }, 300)
        }

        function bindShareButton() {
            var $share = $('button#sharebutton')
            if ($share.length < 1) return

            $share
                .on('click', function (e) {
                    e.preventDefault()
					var data = {
						shareURL : Vizor.shareURL,
						embedSrc : Vizor.embedSrc
					}
                    var html = E2.views.partials.embedVRplayer(data)
                    that.suspendVRcamera()
                    that.headerFadeOut(200)
                    var modal = VizorUI.modalOpen(html, "Share this", 'player_share doselect_all', that.enableVRcamera)
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

                    return false
                })
        }


        function completeLoading() {
            that.selectStage('stage')
            mixpanel.track('Player playing')

            if (!that.controlsBound) {
                bindHeaderBehaviour()
                bindShareButton()
                that.amendVRManagerInstructions()
                that.controlsBound = true
            }
        }

        $canvas.css({display: 'block'})

        var onResize = VizorUI.makeVRCanvasResizeHandler($canvas, $stage)

        $('#edit').click(function () {
            var editUrl = '/' +
                window.location.href
                .split('?')[0]
                .split('/')
                .slice(-2)
                .concat('edit')
                .join('/')

            window.location = editUrl
        })

        function enterFullscreen(e) {
            // webvr manager has extra provisions if in iframe, so E2.core.emit(fullScreenChangeRequested) wont do
            E2.core.webVRManager.onFSClick_()
            siteUI.tagBodyClass()
        }

        function enterVR(e) {
            if (siteUI.isDeviceDesktop()) {
                // display "view in VR" sign
                return that.displayVRPlayerUrl(that.data.shareURL)
            }
			// else
            E2.core.webVRManager.onVRClick_()
            siteUI.tagBodyClass()
        }

        $('#fullscreen').on('click', enterFullscreen)
        $('#entervr').on('click', enterVR)

        $(window).on('resize orientationchange', onResize)
        $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', onResize)

        $(window).on(events.playerLoaded, function () {

            E2.core.on(events.stateChanged, function(newState, old) {
                var s = E2.app.player.state
                $body
                    .toggleClass('playing', newState === s.PLAYING)
                    .toggleClass('paused', newState === s.PAUSED)
                    .toggleClass('stopped', newState === s.STOPPED)
                    .toggleClass('loading', newState === s.LOADING)

                if (newState === s.PLAYING)
					that.queueHeaderFadeOut()
				else
					that.headerFadeIn()
            })

            var progress = (window.Vizor && window.Vizor.onProgress) ? window.Vizor.onProgress : that.onProgress
            E2.core.on(events.loadingProgress, progress)
            E2.core.on(events.doneLoading, completeLoading)

            E2.app.isVRCameraActive = function () {
                if (siteUI && siteUI.lastModalIsOpen) return false
                return that.vrCameraEnabled && !(that.overHeader || that.overControls)
            }

            E2.app.calculateCanvasArea = function () {
                return {
                    width: $stage.innerWidth(),
                    height: $stage.innerHeight()
                }
            }
            onResize()

            that.enableVRcamera()

            // provisions for chrome/android
            $body
                .on(events.vrInstructionsShown, function () {
                    $wrap.hide()
                })
                .on(events.vrInstructionsHidden, function () {
                    $wrap.show()
                    onResize()
                })

            if (siteUI.hasOrientationChange
                && VizorUI.isMobile.any()
//                && VizorUI.isBrowser.Chrome()
            ) {

                var allowExtraHeightOnLandscape = function () {
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

        })		//   /playerLoaded

        var play = this.play

        function preparePlay() {
            $body.addClass('paused')
            var $playButton = jQuery('#playButton')
            $playButton.on('click', play.bind(that))
        }

		var autoplay = (window.Vizor && window.Vizor.autoplay)
        if (autoplay)
            $body.addClass('autoplay')
        else
            preparePlay()

        that.selectStage('loadingStage')

        $('header').show()
        $body.addClass('withPlayerControls')


        $(window).on('unload', function () {})    // iOS frame js issues
    } // end .init()
}

var prot = VizorPlayerUI.prototype

prot.displayVRPlayerUrl = function() {
	var url = (window.Vizor && Vizor.shareURL) ? Vizor.shareURL : window.location.href
	var niceurl = url.replace(/^(http)s?:\/\//i, '')
	this.headerFadeOut()
	return VizorUI.modalOpen("<p>View in VR on your phone</p><a href='" + url + "'>" + niceurl + "</a>", null, 'viewinvr')
}

prot.selectStage = function(elementId) {
	var wrap = jQuery("#playerWrap")
	wrap
		.find('div.stage')
		.removeClass('front')

	return wrap
		.find('#' + elementId)
		.addClass('front')
}

prot.suspendVRcamera = function() {
	this.vrCameraEnabled = false
}

prot.enableVRcamera = function() {
	this.vrCameraEnabled = true
}

prot.play = function() {
	this.selectStage('stage')
	playVizorFile()
		.catch(function (err) {
			var $err = that.selectStage('errorStage')
			$err.html(err)
		})
}

prot.amendVRManagerInstructions = function() {
	var r = E2.core.webVRManager.rotateInstructions
	r.text.innerHTML = r.text.innerHTML.replace("Cardboard viewer", "VR viewer")
	// if not bound directly, it sometimes stops working when reloading player files
	var onclick = "E2.core.webVRManager.onBackClick_();siteUI.tagBodyClass();return false;"
	r.text.innerHTML += "<br /><br /><button style='color:white' onclick='"+onclick+"' id='backfromvr'>Exit VR view</button>"
	r.overlay.style.color = '#ccc'
	r.overlay.style.background = '#2b2f37'
	r.overlay.style.zIndex = "100"
	$('div:last-child', r.overlay)[0].style.display = 'none'
}

prot.headerDisableAutoFadeout = function() {
	this.clearFadeoutTimer()
	this.headerQueueFadeoutEnabled = false
	this.headerFadeIn()
}

prot.headerEnableAutoFadeout = function() {
	this.headerQueueFadeoutEnabled = true
}

prot.clearFadeoutTimer = function () {
	clearTimeout(this.fadeoutTimer)
	this.fadeoutTimer = null
}

prot.queueHeaderFadeOut = function(timeoutMs, forceIfAutoDisabled) {
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

prot.headerFadeOut = function (duration) {
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

prot.headerFadeIn = function () {
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


prot = null	// cleanup

var playerUI = new VizorPlayerUI()
document.addEventListener('DOMContentLoaded', function(){
	if (have_webgl) {
		playerUI.init()
	} else {
		var $err = playerUI.selectStage('errorStage')
		$err.html(E2.views.partials.noWebGL({embed: siteUI.isEmbedded}))
	}
})