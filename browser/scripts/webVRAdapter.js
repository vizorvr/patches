/**
 * wraps around and tweaks webvr boilerplate to work with Vizor
 * @emits VizorWebVRAdapter.events
 */
function VizorWebVRAdapter() {
	EventEmitter.apply(this, arguments)
	this.events = VizorWebVRAdapter.events

	Object.defineProperty(this, 'mode', {
		get: function() {
			return that._manager.mode
		}
	})

	Object.defineProperty(this, 'hmd', {
		get: function() {
			return that._manager.hmd
		}
	})
}

VizorWebVRAdapter.prototype = Object.create(EventEmitter.prototype)

VizorWebVRAdapter.prototype.initialise = function(domElement, renderer, effect, options) {
	var that = this

	// only stored here for convenience/debugging
	this._renderer = renderer
	this._effect = effect
	this.modes = WebVRManager.Modes

	this.domElement = domElement	// typically a canvas

	this.proxyOrientationChange = true
	this.proxyDeviceMotion = (typeof VizorUI !== 'undefined') && VizorUI.isMobile.iOS()

	this.options = options || {
		hideButton: 	true,
		isVRCompatible: true
	}

	this.configure()
	
	this.haveVRDevices = false
	if (hardware) {
		if (!hardware.enumerated)
			hardware.ifVR(hardware.enumerateVRDevices.bind(hardware))

		if (hardware.hmd)
			this.haveVRDevices = true
	}
	this.options.isVRCompatible = this.haveVRDevices
	if (document.body.classList)
		document.body.classList.toggle('hasHMD', this.haveVRDevices)

	this._manager = new WebVRManager(renderer, effect, this.options)

	this.patchWebVRManager()

	this._instructionsChanged = false
	this._lastTarget = null

	this.attach()

	// initial sizing
	this.resizeToTarget()

}

VizorWebVRAdapter.events = Object.freeze({
	displayPresentChanged: 	'displaypresentchanged',
	displayDeviceParamsChanged: 'displaydeviceparamschanged',
	managerInitialised: 	'webvrmanagerinitialised',
	modeChanged: 			'vrmodechanged',
	targetResized: 			'targetsizechanged'
})

VizorWebVRAdapter.prototype.canInitiateCameraMove = function(e) {
	if (E2 && E2.app && E2.app.canInitiateCameraMove)
		return E2.app.canInitiateCameraMove(e)

	// default
	return true
}

// configures the polyfill
VizorWebVRAdapter.prototype.configure = function() {
	window.WebVRConfig = window.WebVRConfig || {}
	var that = this
	var w = window.WebVRConfig

	// w.FORCE_ENABLE_VR 	= true
	w.NO_DPDB_FETCH 	= true
	w.BUFFER_SCALE 		= 1
	w.YAW_ONLY 			= false
	w.TOUCH_PANNER_DISABLED	= false
	w.MOUSE_KEYBOARD_CONTROLS_DISABLED	= false

	var polyfill = window._webVRPolyfill
	if (!polyfill) {
		return console.error('could not find polyfill, functionality may be incomplete')
	}

	polyfill.getVRDisplays()		// navigator.getVRDisplays()
		.then(function(displays){
			displays.forEach(function(display){
				if (display._vizorPatched)
					return
				if (typeof display.getManualPannerRef === 'function') {
					var panner = display.getManualPannerRef()
					if (!(panner && panner.canInitiateRotation))
						return
					panner.canInitiateRotation = function(e){
						return that.canInitiateCameraMove(e)
					}
				} else {
					console.error('no display.getManualPannerRef found', display)
				}
				display._vizorPatched = true
				// note, if display.wrapForFullscreen (removeFullscreenWrapper) is taken out
				// then the cardboard selector won't show on Android because it would fullscreen the canvas, not its parent element
			})
		})

	var r = E2.core.renderer
	if (typeof r.setSizeNoResize === 'undefined') {
		console.error('please patch THREE.WebGLRenderer to include a setSizeNoResize method.')
	}
	else {
		r.setSize = function (width, height) {
			// debug
			// console.error('renderer.setSize called instead of setSizeNoResize')
			this.setSizeNoResize(width, height)
		}.bind(r)
	}
}

// patches the web vr manager so that requestFullscreen fullscreens our container
VizorWebVRAdapter.prototype.patchWebVRManager = function() {
	var that = this
	var m = this._manager

	if (m.mode !== this.modes.NORMAL)
		m.setMode_(this.modes.NORMAL)

	if (m.requestFullscreen__)
		return

	m.requestFullscreen__ = m.requestFullscreen_
	m.requestFullscreen_ = function() {
		return this.requestFullscreen__(that.domElement)
	}.bind(m)
}

VizorWebVRAdapter.prototype.attach = function() {
	// events emitted by boilerplate/polyfill
	window.addEventListener('message', this.onMessageReceived.bind(this), false)
	window.addEventListener('vrdisplaypresentchange', this._onVRPresentChange.bind(this), false)
	window.addEventListener('vrdisplaydeviceparamschange', this._onVRDisplayDeviceParamsChange.bind(this), false)
	this._manager.on('initialized', this._onManagerInitialised.bind(this))
	this._manager.on('modechange', this._onManagerModeChanged.bind(this))

	this.listenToBrowserEvents()
}

VizorWebVRAdapter.prototype.listenToBrowserEvents = function() {
	var handler = this._onBrowserResize
	if (handler) {
		window.removeEventListener('resize', handler, true)
		window.removeEventListener('orientationchange', handler, true)
		document.removeEventListener('webkitfullscreenchange', handler, true)
		document.removeEventListener('mozfullscreenchange', handler, true)
		document.removeEventListener('fullscreenchange', handler, true)
	} else {
		this._onBrowserResize = this.onBrowserResize.bind(this)
		handler = this._onBrowserResize
	}
	window.addEventListener('resize', handler, true)
	window.addEventListener('orientationchange', handler, true)
	document.addEventListener('webkitfullscreenchange', handler, true)
	document.addEventListener('mozfullscreenchange', handler, true)
	document.addEventListener('fullscreenchange', handler, true)
}

VizorWebVRAdapter.prototype.onBrowserResize = function() {
	var isFullscreen = E2.util.isFullscreen()

	if (document.body.classList && this.domElement) {
		var elClasses = this.domElement.classList
		var parentClasses = this.domElement.parentElement.classList

		elClasses.toggle('webgl-canvas-fs', isFullscreen)
		elClasses.toggle('webgl-canvas-normal', !isFullscreen)

		parentClasses.toggle('webgl-container-fs', isFullscreen)
		parentClasses.toggle('webgl-container-normal', !isFullscreen)
	}

	this.resizeToTarget()
}

VizorWebVRAdapter.prototype.isElementFullScreen = function() {
	return E2.util.isFullscreen()
}

VizorWebVRAdapter.prototype.setDomElementDimensions = function(width, height, devicePixelRatio) {
	// the order here is important for iOS
	this.domElement.parentElement.style.zoom = 1.1	// issue with iOS 9.3
	this.domElement.style.width = width + 'px'
	this.domElement.style.height = height + 'px'
	this.domElement.width = width * devicePixelRatio
	this.domElement.height = height * devicePixelRatio
	this.domElement.parentElement.style.zoom = 1
}

VizorWebVRAdapter.prototype.getDomElementDimensions = function() {
	var ret
	if (this.isElementFullScreen())
		ret = {
			width:  window.innerWidth,
			height: window.innerHeight
		}
	else if (this.domElement) {
		var clientRect = this.domElement.parentElement.getBoundingClientRect()
		ret = {
			width: clientRect.width,
			height: clientRect.height
		}
	}
	return ret
}

VizorWebVRAdapter.prototype.resizeToTarget = function() {

	var size = this.getTargetSize()
	var lastTarget = this._lastTarget

	if (lastTarget &&
			lastTarget.domElement === this.domElement &&
			lastTarget.width === size.width &&
			lastTarget.height === size.height &&
			lastTarget.devicePixelRatio === size.devicePixelRatio) {
		console.info('resizeToTarget: element and dimensions are the same')
		// allow
	}

	if (!this.domElement)
		return

	lastTarget = size
	lastTarget.domElement = this.domElement
	this._lastTarget = lastTarget

	this.setTargetSize(size.width, size.height, size.devicePixelRatio)

}

VizorWebVRAdapter.prototype.setTargetSize = function(width, height, devicePixelRatio) {
	if ((width === 0) || (height === 0)) {
		console.error('setTargetSize 0x0')
		return false
	}

	this.setDomElementDimensions(width, height, devicePixelRatio)
	var eventData = {
		width: width,
		height: height,
		devicePixelRatio: devicePixelRatio
	}

	this.emit(this.events.targetResized, eventData)

	E2.core.emit('resize', eventData)
}

VizorWebVRAdapter.prototype.getTargetSize = function() {
	var manager = this._manager, hmd = manager.hmd
	var isPresenting = hmd && hmd.isPresenting

	var size = {
		width: -1,
		height: -1,
		devicePixelRatio: 0
	}

	var domSize = this.getDomElementDimensions()

	if (isPresenting) {
		var leftEye  = hmd.getEyeParameters("left")
		var rightEye = hmd.getEyeParameters("right")

		var dpr = window.devicePixelRatio

		size.width  = leftEye.renderWidth + rightEye.renderWidth
		size.height = leftEye.renderHeight // assume they're the same
		size.width /= dpr
		size.height /= dpr
		size.devicePixelRatio = dpr
	}
	else {
		size.width  = domSize.width
		size.height = domSize.height
		size.devicePixelRatio = window.devicePixelRatio
	}

	size.isPresenting = !!isPresenting

	return size
}


// event handling
VizorWebVRAdapter.prototype.onMessageReceived = function(e) {
	if (!e.data)
		return

	var proxyEvent

	if (this.proxyOrientationChange && e.data.orientation) {
		proxyEvent = new CustomEvent('orientationchange', {detail: {orientation: e.data.orientation}})
		window.dispatchEvent(proxyEvent)
	}

	if (this.proxyDeviceMotion && e.data.devicemotion) {
		proxyEvent = new CustomEvent('devicemotion', {detail: {devicemotion: e.data.devicemotion}})
		window.dispatchEvent(proxyEvent)
	}
}

// event proxies

VizorWebVRAdapter.prototype._onVRDisplayDeviceParamsChange = function(e) {
	this.emit(this.events.displayDeviceParamsChanged, e)
	return true
}

VizorWebVRAdapter.prototype._onVRPresentChange = function(e) {
	this.emit(this.events.displayPresentChanged, e)
	return true
}

VizorWebVRAdapter.prototype._onManagerInitialised = function(e) {
	this.emit(this.events.managerInitialised, {
		domElement: this.domElement,
		size: this.getDomElementDimensions(),
		mode: this._manager.mode
	})
}

VizorWebVRAdapter.prototype._onManagerModeChanged = function(mode, oldMode) {

	if (typeof siteUI !== 'undefined') {
		siteUI.tagBodyClass()

		if (!siteUI.isDeviceDesktop()) {
			if (mode !== WebVRManager.Modes.NORMAL)
				this._addViewportMeta()
			else
				this._removeViewportMeta()
		}
	}

	// remove popovers
	var tooltips = document.body.getElementsByClassName('popover')
	if (tooltips.length > 0) {
		Array.prototype.forEach.call(tooltips, function(n){n.parentElement.removeChild(n)})
	}

	this.emit(this.events.modeChanged, mode, oldMode)

	// fix iOS bug
	this.onBrowserResize()

}

VizorWebVRAdapter.prototype.amendVRManagerInstructions = function() {
	var r = this.getHmdRotateInstructions()

	if (!r) {
		console.log('no rotate instructions found')
		return
	}

	var o = r.overlay

	if (o.className === 'VRInstructions') { // already changed
		this._instructionsChanged = true
		return
	}
	o.className = 'VRInstructions'

	var originalImage = o.getElementsByTagName('IMG')
	originalImage[0].style.display = 'none';

	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href','#player-mobile-graphic');
	svg.appendChild(use)
	var s = svg.style
	s.marginLeft = '-92px'
	s.marginTop = '-54px'
	s.left = '50%'
	s.top = '35%'
	s.position = 'absolute'
	s.width = '184px'
	s.height = '108px'
	s.display = 'block'

	o.style.height = '100%'
	o.insertBefore(svg, o.firstChild)


	r.text.innerHTML = r.text.innerHTML.replace("Cardboard viewer", "VR viewer")

	// if not bound directly, it sometimes stops working when reloading player files
	var onclick = "E2.core.webVRAdapter.exitVROrFullscreen();return false;"
	r.text.innerHTML += "<br /><br /><button style='color:white' onclick='"+onclick+"' id='backfromvr'>Exit VR view</button>"

	r.text.style.position = 'absolute'
	r.text.style.top = '50%'
	r.overlay.style.color = '#ccc'
	r.overlay.style.background = '#2b2f37'
	r.overlay.style.zIndex = "100"
	var divs = r.overlay.children
	if (divs && divs.length > 0) {
		var getOne = divs[divs.length-1]
		getOne.parentElement.removeChild(getOne)
	}

	this._instructionsChanged = true

}

VizorWebVRAdapter.prototype.getCurrentManagerMode = function() {
	return this._manager.mode
}

VizorWebVRAdapter.prototype.isVRMode = function() {
	var isPlayerPlaying = E2 && E2.app && E2.app.player && (E2.app.player.current_state === E2.app.player.state.PLAYING)
	var isVRMode = (this.getCurrentManagerMode() === WebVRManager.Modes.VR)
	return isPlayerPlaying && isVRMode
}

VizorWebVRAdapter.prototype.render = function(scene, camera) {
	return this._manager.render(scene, camera)
}

VizorWebVRAdapter.prototype.exitVROrFullscreen = function() {
	var that = this
	var manager = this._manager
	var hmd = manager.hmd
	var modeNormal = WebVRManager.Modes.NORMAL
	// to get back to normal mode, we have to:
	// 1) exit presentation mode
	// 2) do an equivalent to WebVRManager.prototype.onBackClick_()
	if (hmd && hmd.isPresenting) {
		hmd.exitPresent()
		.then(function() {
			that.setMode(modeNormal)
		})
	}
	else {
		// no hmd, we still want to go to normal mode
		this.setMode(modeNormal)
	}
}

VizorWebVRAdapter.prototype.isVRCompatible = function() {
	return this.haveVRDevices
}

VizorWebVRAdapter.prototype._addViewportMeta = function() {
	var meta = document.getElementById('viewportmeta')
	if (!meta) {
		meta = document.createElement('meta')
		meta.id = 'viewportmeta'
		meta.setAttribute('name', 'viewport')
		meta.setAttribute('data-auto', 'true')
		document.head.appendChild(meta)
	}
	if (meta.getAttribute('data-auto') === 'true') {
		meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no')
	} else {
		var p = meta.parentElement
		p.removeChild(meta)
		p.appendChild(meta)
	}
}

VizorWebVRAdapter.prototype._removeViewportMeta = function() {
	var meta = document.getElementById('viewportmeta')
	if (!meta) return
	if (meta.getAttribute('data-auto') === 'true') {
		meta.setAttribute('content', 'width=auto, initial-scale=auto, minimum-scale=0.7, maximum-scale=2, user-scalable=1')
		setTimeout(function(){
			var meta = document.getElementById('viewportmeta')
			if (meta)
				meta.parentNode.removeChild(meta)
		}, 10000)
	} else {
		var p = meta.parentElement
		p.removeChild(meta)
		p.appendChild(meta)
	}
}

VizorWebVRAdapter.prototype.enterVROrFullscreen = function() {
	if (this.isVRCompatible())
		this.enterVR()
	else
		this.enterFullscreen()
}

VizorWebVRAdapter.prototype.toggleFullScreen = function() {
	var goingToFullscreen = this._manager.mode === this.modes.NORMAL

	if (goingToFullscreen) { // normal to VR or full screen
		return this.enterVROrFullscreen()
	}
	else {
		// toggleFullScreen doesn't get back from VR mode so we have to
		// do it ourselves
		return this.exitVROrFullscreen()
	}
}

VizorWebVRAdapter.prototype.enterFullscreen = function() {
	return this.setMode(this.modes.MAGIC_WINDOW)
}

VizorWebVRAdapter.prototype.enterVR = function() {
	return this.setMode(this.modes.VR)
}

VizorWebVRAdapter.prototype.setMode = function(mode) {
	// replicating some of the manager functionality here

	var manager = this._manager
	var modes = this.modes
	var oldMode = manager.mode

	if (!this._instructionsChanged)
		this.amendVRManagerInstructions()

	switch (mode) {
		case modes.VR:
			manager.onVRClick_()
			break
		case modes.MAGIC_WINDOW:
			manager.onFSClick_()
			break
		case modes.NORMAL:
			manager.setMode_(mode)
			manager.exitFullscreen_()
			break
	}
	this._onManagerModeChanged(mode, oldMode)

}
VizorWebVRAdapter.prototype.getHmdRotateInstructions = function() {
	if (!(this._manager && this._manager.hmd))
		return
	return this._manager.hmd.rotateInstructions_
}

VizorWebVRAdapter.isNativeWebVRAvailable = function() {
	return _webVRPolyfill.nativeWebVRAvailable || _webVRPolyfill.nativeLegacyWebVRAvailable
}
VizorWebVRAdapter.prototype.isNativeWebVRAvailable = VizorWebVRAdapter.isNativeWebVRAvailable

if (typeof module !== 'undefined')
	module.exports.VizorWebVRAdapter = VizorWebVRAdapter
