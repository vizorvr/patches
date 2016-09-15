var assert = require('assert')
var UIBreadcrumb = require('../../scripts/ui-breadcrumb')

global.jQuery = function(){
	var blank = ()=>{}
	this._html = ''
	this.html = function(html){return (typeof html !== 'undefined') ? (this._html = html) : this._html}

	this.find = function(){
		var _on = this._on = {}
		return {on: (c,h)=>{_on[c]=h}, off:blank}
	}
}
var $ = () => new jQuery()


describe('UIBreadcrumb', function() {
	var u
	beforeEach(function () {
		u = new UIBreadcrumb()
	})

	it('produces template data', function (done) {
		var data = u.getTemplateData()
		assert.equal(typeof (data.options), 'object', 'data must contain .options')
		assert.equal(Array.isArray(data.crumbs), true, 'data must contain array of .crumbs')
		u.add('test')
		assert.equal(typeof data.crumbs[0], 'object', 'crumbs must be objects')

		done()
	})

	it('adds crumbs', function (done) {
		u.add('test')
		u.add('test2', '#tx2')
		u.add('test3', '#tx3', null, '$one$')

		var crumbs = u.getTemplateData().crumbs

		assert.equal(crumbs.length, 3, 'there must be three crumbs')
		assert.equal(crumbs[0].text, 'test', 'must have correct text')
		assert.equal(crumbs[1].link, '#tx2', 'must have correct link')
		assert.equal(crumbs[2].uid, '$one$', 'must have correct uid')

		done()
	})


	it('prepends crumbs', function (done) {
		u.add('test')
		var crumbs = u.getTemplateData().crumbs
		assert.equal(crumbs[0].text, 'test', 'test crumb must come first')
		u.prepend('prepend')
		assert.equal(crumbs[0].text, 'prepend', 'prepend crumb must come first')
		done()
	})


	it('adds a click handler', function(done){
		var ch = function(){}
		u.add('test4', '#tx4', ch, '$two$')
		assert.equal(u.clickHandlers['$two$'], ch, 'must push clickHandler')
		done()
	})


	it('counts crumbs right', function (done) {
		var rnd = 5 + Math.round(Math.random()*100)
		for (var i=rnd; i>0; i--) {
			u.add('test'+i)
		}
		assert.equal(u.length, u.getTemplateData().crumbs.length, 'must have same length as crumbs')
		assert.equal(u.length, rnd, 'must have correct length')

		done()
	})

	it('distinguishes between crumbs that look the same', function (done) {
		var ch1 = function(){}
		var ch2 = function(){}
		u.add('test', '#test', ch1, '$one$')
		u.add('test', '#test', ch2, '$two$')
		var cr = u.getTemplateData().crumbs
		assert.equal(u.length, 2)
		assert.equal(cr[0].text, cr[1].text)
		assert.notEqual(cr[0].uid, cr[1].uid)
		assert.equal(ch1, u.clickHandlers['$one$'])
		assert.notEqual(ch1, u.clickHandlers['$two$'])
		assert.equal(ch2, u.clickHandlers['$two$'])
		done()
	})

	it('attaches', function(done){
		u.add('sizz')
		var container = $('#el')
		var $j = u.render(container)
		var template = $j.html
		assert.deepEqual(u.container, container, 'must refer to container')
		assert.equal(template('test'), 'test', 'must have default fallback template')
		assert.equal(typeof u.container['_on']['click.breadcrumb'], 'function', 'must have a func inside onclick handlers')
		done()
	})

})