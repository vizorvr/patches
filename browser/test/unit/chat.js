var assert = require('assert')
global.Flux = require('../../vendor/flux')
global.EventEmitter = require('events').EventEmitter

var Chat = require('../../scripts/chat').Chat
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

	describe('Chat', function() {
		var chat
		global.E2 = {
			app: {
				chatStore: {
					on: function() {}
				}
			}
		}

		beforeEach(function() {
			chat = new Chat()
		})

		it('formats a vizor link correctly', function() {
			var text = chat._messageCleaner('vizor.io/foo/bar')
			assert.equal('<a target="_blank" href="http://vizor.io/foo/bar">vizor.io/foo/bar</a>', text)
		})

		it('formats a full vizor url correctly', function() {
			var text = chat._messageCleaner('a b c http://vizor.io/foo/bar b')
			assert.equal('a b c <a target="_blank" href="http://vizor.io/foo/bar">vizor.io/foo/bar</a> b', text)
		})

		it('formats a subdomain link correctly', function() {
			var text = chat._messageCleaner('a fhoo.vizor.io/foo/bar baz')
			assert.equal('a <a target="_blank" href="http://fhoo.vizor.io/foo/bar">fhoo.vizor.io/foo/bar</a> baz', text)
		})
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
