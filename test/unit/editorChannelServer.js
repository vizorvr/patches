var mongoose = require('mongoose')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var EditorChannelServer = require('../../lib/editorChannelServer').EditorChannelServer

function makeClient(id) {
	return {
		id: id,
		socket: new EventEmitter(),
		channels: [],
		toJson: function() {
			return {}
		}
	}
}

describe('EditorChannelServer', function() {
	after(function() {
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()
	})

	it('removes correctly on leave', function() {
		var client = makeClient('a1')
		var ecs = new EditorChannelServer()
		ecs.joinChannel('Global', 'foo', client, { activeGraphUid: 'a' })
		assert.equal(ecs.channels.Global.length, 1)
		ecs.leaveChannel('Global', client)
		assert.equal(ecs.channels.Global.length, 0)
	})

	it('removes correctly on socket close', function() {
		var client = makeClient('a2')
		var ecs = new EditorChannelServer()
		ecs.joinChannel('Global', 'foo', client, { activeGraphUid: 'a' })
		assert.equal(ecs.channels.Global.length, 1)
		ecs.onSocketClosed(client)
		assert.equal(ecs.channels.Global.length, 0)
	})
})
