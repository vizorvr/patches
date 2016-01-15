var assert = require('assert')

global.EventEmitter = require('events').EventEmitter

var EditorChannel = require('../../scripts/editorChannel')

describe('EditorChannel', function() {
	var ec 

	beforeEach(function() {
		global._ = {
			clone: function() {}
		}
		global.E2 = {
			app: {
				dispatcher: {
					register: function() {}
				}
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
		ec.send({ actionType: 'uiMouseMoved' })
		ec.send({ actionType: 'uiMouseClicked' })
		ec.connected = true
		ec.forking = false
		ec.processQueue()
		assert.equal(ec.queue.length, 0)
	})


})