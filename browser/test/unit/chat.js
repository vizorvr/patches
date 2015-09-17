var assert = require('assert')
global.Flux = require('../../vendor/flux')
global.EventEmitter = require('events').EventEmitter

var ChatStore = require('../../scripts/chat').ChatStore

describe('Chat system', function() {
	var cs, wsChannel
	beforeEach(function() {
		global.window = {}
		global.$ = function(){ return { length: 1 } }
		global.E2 = {
			util: {
				isScrolledIntoView: function() {}
			},
			views: {
				chat: { meta: '' }
			},
			app: {
				dispatcher: new Flux.Dispatcher(),
				chatStore: new EventEmitter(),
				channel: {
					on: function(){},
					getWsChannel: function() {
						wsChannel = new EventEmitter()
						wsChannel.ws = {
							send: function() {}
						}
						wsChannel.send = function() {}

						return wsChannel
					}
				}
			}}

		cs = new ChatStore()
	})

	describe('ChatStore', function() {
		it('emits join', function(done) {
			cs.on('joined', done.bind({}, null))
			wsChannel.emit('Global', { kind: 'join', from: 'foo' })
		})

		it('emits left', function(done) {
			cs.on('left', done.bind({}, null))
			wsChannel.emit('Global', { kind: 'leave', from: 'foo' })
		})

		it('dispatches chats from network', function(done) {
			E2.app.dispatcher.register(function(pl) {
				assert.equal(pl.actionType, 'uiChatMessageAdded')
				assert.equal(pl.message, 'foo')
				done()
			})
			wsChannel.emit('Global', { actionType: 'uiChatMessageAdded', message: 'foo', from: 'bar' })
		})

		it('emits added on dispatch', function(done) {
			cs.on('added', function(m) {
				assert.ok(m.foo, 'bar')
				done()
			})

			E2.app.dispatcher.dispatch({
				actionType: 'uiChatMessageAdded',
				foo: 'bar'
			})
		})

		it('calls send on local messages', function(done) {
			wsChannel.send = function(cn, message) {
				assert.ok(message.message, 'bar')
				done()
			}

			E2.app.dispatcher.dispatch({
				actionType: 'uiChatMessageAdded',
				message: 'bar'
			})
		})
	})

})
