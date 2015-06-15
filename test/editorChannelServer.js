var mongoose = require('mongoose')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var EditorChannelServer = require('../lib/editorChannelServer').EditorChannelServer

describe('EditorChannelServer', function() {
	after(function() {
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()
	})

	it('removes correctly on leave', function() {
		var client = { id: 'a', channels: [] }
		var ecs = new EditorChannelServer()
		var client = ecs.handleConnection(new EventEmitter())
		ecs.joinChannel('asdf', client)
		assert.equal(ecs.channels['asdf'].length, 1)

		ecs.leaveChannel('asdf', client)
		assert.equal(ecs.channels['asdf'].length, 0)
	})

	it('removes correctly on socket close', function() {
		var client = { id: 'a', channels: [] }
		var ecs = new EditorChannelServer()
		var socket = new EventEmitter()
		var client = ecs.handleConnection(socket)
		ecs.joinChannel('asdf', client)
		assert.equal(ecs.channels['asdf'].length, 1)
		socket.emit('close')
		assert.equal(ecs.channels['asdf'].length, 0)
	})
})
