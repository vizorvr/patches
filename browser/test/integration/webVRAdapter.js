var assert = require('assert')
var EventEmitter = require('events').EventEmitter
var helpers = require('./helpers')
var reset = helpers.reset
var setupThree = helpers.setupThree

var VizorWebVRAdapter = require('../../scripts/webVRAdapter.js')	// respect mocks

var mockWebVRManager = function() {
	var modes = WebVRManager.Modes
	global.WebVRManager = function (renderer, effect, params) {
		EventEmitter.call(this)
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
	global.WebVRManager.prototype = Object.create(EventEmitter.prototype)
	global.WebVRManager.Modes = modes
}


describe('Web VR Manager', function() {

	beforeEach(function(done) {
		reset()
		global.E2.core.renderer.setSizeNoResize = function(){}
		mockWebVRManager()
		E2.core.webVRAdapter.on('ready', done)
		console.log('instanti')
		E2.app.instantiatePlugin('three_webgl_renderer')
	})

	it('instantiates a webvr adapter', function(done){
		assert.ok(E2.core.webVRAdapter, 'found a web vr adapter')
		assert.ok(E2.core.webVRAdapter instanceof global.VizorWebVRAdapter, 'found a VizorWebVRAdapter')
		done()
	})

	it('gets and sets mode', function(done){
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