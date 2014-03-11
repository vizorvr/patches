"use strict";

var fs = require('fs')
var assert = require('assert')
var jsdom = require('jsdom').jsdom
var handlebars = require('handlebars')
var html = fs.readFileSync(__dirname+'/fixtures/file-select-control.html').toString()

global.window = jsdom(html).createWindow();
global.document = window.document;
global.$ = require('jquery')
global.jQuery = global.$;

$.fn.modal = function() {}

var FileSelectControl = require('../browser/scripts/file-select-control').FileSelectControl

describe('FileSelectControl', function() {
	var s

	beforeEach(function() {
		s = new FileSelectControl(handlebars)
		s.files(['a','b','c'])
		.selected('b')
	})

	afterEach(function() {
		$('body').empty()		
	})

	it('sets list of files given string array', function() {
		assert.deepEqual([{name:'a'}, {name:'b'}, {name:'c'}], s._files)
	})

	it('sets buttons up with callback function', function(done) {
		s.buttons({ 'Done': function() { done(); }}).modal()
		$('button:last', s._el).click()
	})

	it('selects right file with key up', function(done) {
		s.onChange(function(file) { 
			assert.equal(file, 'a')
			done()
		})
		.modal()

		var e = $.Event('keydown')
		e.keyCode = 38
		s._el.trigger(e);
	})

	it('selects right file with key down', function(done) {
		s.onChange(function(file) { 
			assert.equal(file, 'c')
			done()
		})
		.modal()

		var e = $.Event('keydown')
		e.keyCode = 40
		s._el.trigger(e);
	})

	it('selects right file with click', function(done) {
		s.onChange(function(file) { 
			assert.equal(file, 'a')
			done()
		})
		.modal()

		$('tr:first', s._el).click()
	})

	it('selects right file and closes dialog with dblclick', function(done) {
		s.buttons({ Ok: function(file) {
			assert.equal(file, 'a')
			done()
		}})
		.modal()

		$('tr:first', s._el).dblclick()
	})

	it('accepts other input', function(done) {
		s.onChange(function(file) { 
			assert.equal(file, 'http://foo')
			done()
		})
		.modal()

		$('input', s._el).val('http://foo').change()
	})

	it('sets original value on cancel', function(done) {
		var i = 0;
		s.onChange(function(file) {
			if (!i++) return;
			assert.equal(file, 'b')
			done()
		})
		.modal()

		$('tr:first', s._el).click()
		$('button:contains("Cancel")').click()
	})

})


