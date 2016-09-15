var when = require('when')
var assert = require('assert')
var EventEmitter = require('events').EventEmitter

describe('PlayerUI', function() {
	var PlayerUI

	function makePlayerUi() {
		var pui = new VizorPlayerUI()
		pui.headerFadeIn = function() {}
		pui.headerFadeOut = function() {}
		pui.$wrap = [{
			style: {},
		}]
		pui.$wrap.attr = function() {}
		pui.$body = {
			toggleClass: function() { return pui.$body },
			addClass: function() { return pui.$body },
			removeClass: function() { return pui.$body },
		}
		return pui
	}

	beforeEach(function() {
		global.E2 = {
			track: function() {},
			core: {
				webVRAdapter: {
					resizeToTarget: function() {}
				}
			},
			uid: function() { return dateNow },
			app: {
				player: {
					state: {
						STOPPED: 0,
						LOADING: 1,
						READY: 2,
						PAUSED: 3,
						PLAYING: 4
					}
				}
			}
		}

		global.Vizor = {}
		global.window = global
		global.siteUI = { isInIframe: function() {} }
		global.$ = function() {
			var ee = new EventEmitter()
			ee.addClass = function() {}
			ee.removeClass = function() {}
			ee.find = function() {
				return ee
			}
			return ee
		}
		global.document = {
			querySelector : function(){}
		}
		VizorPlayerUI = require('../../scripts/ui/playerUI')
	})

	it('switches stage from player state', function() {
		global.Vizor.autoplay = false
		var pui = makePlayerUi()
		pui.onPlayerStateChanged(0) // STOPPED
		assert.equal(pui.stage, 'readyStage')
		pui.onPlayerStateChanged(1) // LOADING
		assert.equal(pui.stage, 'loadingStage')
		pui.onPlayerStateChanged(2) // READY
		assert.equal(pui.stage, 'readyStage')
		pui.onPlayerStateChanged(3) // PAUSED
		assert.equal(pui.stage, 'readyStage')
		pui.onPlayerStateChanged(4) // PLAYING
		assert.equal(pui.stage, 'playingStage')
	})

	it('plays the graph on play button click in readyStage', function(done) {
		E2.app.player.play = done
		var pui = makePlayerUi()
		pui.stage = 'readyStage'
		pui.onPlayButtonClicked()
	})

	it('loads the graph on play button click in beforeLoadingStage', function(done) {
		global.loadVizorGraph = function() {
			done()
			return when.resolve()
		}
		var pui = makePlayerUi()
		pui.stage = 'beforeLoadingStage'
		pui.onPlayButtonClicked()
	})

})

