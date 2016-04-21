var assert = require('assert')
var helpers = require('./helpers')
var reset = helpers.reset
var setupThree = helpers.setupThree

var VizorWebVRAdapter = require('../../scripts/webVRAdapter.js')	// respect mocks

var mockWebVRManager = function() {
	var modes = WebVRManager.Modes
	global.WebVRManager = function (renderer, effect, params) {
		var that = this
		this.renderer = renderer
		this.effect = effect
		this.params = params
		this.mode = null
		this.setMode_ = function (mode) {
			that.mode = mode
		}
		this.fsClickCalled = false
		this.vrClickCalled = false
		this.exitFullScreenCalled = false
		this.onFSClick_ = function(){
			that.setMode_(modes.MAGIC_WINDOW)
			that.fsClickCalled = true
		}
		this.onVRClick_ = function(){
			that.setMode_(modes.VR)
			that.vrClickCalled = true
		}
		this.exitFullscreen_ = function(){
			that.setMode_(modes.NORMAL)
			that.exitFullScreenCalled = true
		}

		this.on = function(){}
	}
	global.WebVRManager.Modes = modes
}


describe('Web VR Manager', function() {

	beforeEach(function(){
		reset()
		global.E2.core.renderer.setSizeNoResize = function(){}
		mockWebVRManager()
	})

	it('instantiates a webvr adapter', function(done){
		E2.core.webAdapter = null
		E2.app.instantiatePlugin('three_webgl_renderer')
		assert.ok(E2.core.webVRAdapter, 'found a web vr adapter')
		assert.ok(E2.core.webVRAdapter instanceof global.VizorWebVRAdapter, 'found a VizorWebVRAdapter')
		done()
	})

	it('gets and sets mode', function(done){

		E2.app.instantiatePlugin('three_webgl_renderer')
		var a = E2.core.webVRAdapter, modes = a.modes

		var newMode

		newMode = modes.MAGIC_WINDOW
		a.setMode(newMode)
		assert.equal(a.getCurrentManagerMode(), newMode, 'should set fullscreen mode')
		assert.ok(a._manager.fsClickCalled, 'should have called manager.onFSClick!')

		newMode = modes.VR
		a.setMode(newMode)
		assert.equal(a.getCurrentManagerMode(), newMode, 'should set VR mode')
		assert.ok(a._manager.vrClickCalled, 'should have called manager.onVRClick')

		done()
	})

	it('toggles fullscreen', function(done){
		E2.app.instantiatePlugin('three_webgl_renderer')
		var a = E2.core.webVRAdapter, modes = a.modes

		a.setMode(modes.NORMAL)

		a.toggleFullScreen()
		assert.notEqual(a.getCurrentManagerMode(), modes.NORMAL, 'should toggle fullscreen')

		a.setMode(modes.MAGIC_WINDOW)
		a.toggleFullScreen()
		assert.equal(a.getCurrentManagerMode(), modes.NORMAL, 'should exit fullscreen OK')

		done()
	})

	it('tries to amend vr manager instructions', function(done){
		E2.app.instantiatePlugin('three_webgl_renderer')
		var a = E2.core.webVRAdapter, modes = a.modes

		var triedToAmendInstructions = false
		a.amendVRManagerInstructions = function() {
			triedToAmendInstructions = true
		}
		a.setMode(modes.VR)
		assert.ok(triedToAmendInstructions, 'should have tried to modify instructions')

		a.setMode(modes.NORMAL)

		triedToAmendInstructions = false
		a._instructionsChanged = true
		a.setMode(modes.VR)
		assert.ok(!triedToAmendInstructions, 'should NOT have tried to modify instructions')

		done()
	})

	it('triggers modechanged events', function(done){

		E2.app.instantiatePlugin('three_webgl_renderer')
		var a = E2.core.webVRAdapter, modes = a.modes

		var modeChangeTriggered = false
		a.on(a.events.modeChanged, function(){
			modeChangeTriggered = true
		})

		a.setMode(modes.VR)
		assert.ok(modeChangeTriggered, 'expected mode change event')
		done()
	});

})