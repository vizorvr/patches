"use strict";

var fs = require('fs')
var assert = require('assert')
var jsdom = require('jsdom')
var html = fs.readFileSync(__dirname+'/../browser/player.html').toString()
var player_scene_json = fs.readFileSync(__dirname+'/../browser/player_scene.json').toString()

var scripts = [
	"../node_modules/jquery/dist/jquery.min.js",
	"../browser/vendor/jquery.fastfix.js",
	"../browser/vendor/jquery.mousewheel.js",
	"../browser/vendor/gl-matrix.js",
	"../browser/scripts/util.js",
	"../browser/scripts/renderer.js",
	"../browser/scripts/plugin-group.js",
	"../browser/scripts/plugin-manager.js",
	"../browser/scripts/connection.js",
	"../browser/scripts/graph.js",
	"../browser/scripts/node.js",
	"../browser/scripts/node-ui.js",
	"../browser/scripts/registers.js",
	"../browser/scripts/core.js",
	"../browser/scripts/application.js",
	"../browser/scripts/player.js"
]

function setup(cb) {
	jsdom.env(
	{
		html: html,
		scripts: scripts,
		features: {
			FetchExternalResources   : ['script'],
			ProcessExternalResources : ['script'],
			MutationEvents           : '2.0',
		},

		done: function (errors, window)
		{
			var $ = window.$;
			$('#webgl-canvas')[0].getContext = function() {
				return require('gl').createContext(640, 480);
			}

			window.Image = function() {
				console.log('ha! image shimage!');
			}

			var lastTime = 0;
			window.requestAnimFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				window._nextFrameCallback = callback;
				// var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
				// 	timeToCall);
				// lastTime = currTime + timeToCall;
				// return id;
			};

			window.cancelAnimFrame = function(id) {
				clearTimeout(id);
			};

			window.console.assert = function() {
				console.assert.apply(console.assert, arguments)
			}
			window.console.log = function() {
				console.log.apply(console.log, arguments)
			}

			// window.msg = window.console.log;

			window.$.ajax = function(options) {
				console.log('ajax', options.url);

				switch(options.url) {
					case 'plugins/all.plugins.js':
						return options.error();
					default:
						return window.load_script(options.url, options.success)
				}
			}

			window.load_script = function(url, cb) {
				var readPath = __dirname + '/../browser/' + url;
				console.log('load_script', readPath)
				var buf = fs.readFileSync(readPath).toString();

				if (url.indexOf('.json') !== -1)
					buf = JSON.parse(buf);
				else
					window.eval(buf);

				return cb(buf);
			}

			window.CreatePlayer(function wait_for_init(player)
			{
				console.log('have player')
				player.load_from_json(player_scene_json);
				cb(window, player)
			});
		}
	});
}

describe('graph', function()
{
	var window;

	beforeEach(function(done)
	{
		setup(function(w) {
			window = w
			done()
		})
	})

	it('works', function() {
		assert.equal(window.E2.app.player.core.graphs.length, 1);
	})
})
