var assert = require('assert')
var when = require('when')

global._ = require('lodash')
global.EventEmitter = require('events').EventEmitter

var EditorChannel = require('../../scripts/editorChannel')

describe('EditorChannel', function() {
	var ec 
	var forkPromise

	beforeEach(function() {
		global.E2 = {
			ui: {
				updateProgressBar: function() {}
			},
			app: {
				growl: function() {},
				dispatcher: {
					register: function() {}
				}
			}
		}
		global.ForkCommand = function() {
			this.fork = function() {
				forkPromise = when.defer()
				return forkPromise.promise
			}
		}

		ec = new EditorChannel()
		ec.wsChannel = {
			send: function() {}
		}
	})

	it('can`t send if not connected', function() {
		ec.connected = false
		assert.equal(ec.canSend(), false)
	})

	it('can`t send if forking', function() {
		ec.connected = true
		ec.forking = true
		assert.equal(ec.canSend(), false)
	})

	it('queues messages', function() {
		ec.connected = false
		ec.send({ actionType: 'uiMouseMoved' })
		ec.send({ actionType: 'uiMouseClicked' })
		assert.equal(ec.queue.length, 2)
	})

	it('processes queue if it can send', function() {
		ec.channelName = 'foo'
		ec.send({ actionType: 'uiMouseMoved' })
		ec.send({ actionType: 'uiMouseClicked' })
		ec.connected = true
		ec.forking = false
		ec.processQueue()
		assert.equal(ec.queue.length, 0)
	})

	it('replays queued messages after fork', function(done) {
		var dispatches = 0
		ec.fork()
		ec.send({ actionType: 'uiNodeRemoved' })
		ec.send({ actionType: 'uiDisconnected' })
		assert.equal(ec.queue.length, 2)
		forkPromise.resolve()
		global.E2.app.dispatcher.dispatch = function(pl) {
			if (++dispatches === 2)
				done()
		}
	})

})