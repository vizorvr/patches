/**
 * simple breadcrumb control using handlebars template
 * known limitations - if used server-side it won't attach clickhandlers
 */
var UIbreadcrumb = function(/* @var jQuery|null */ $existingContainer) {
	var that = this
	this.crumbs = []
	this.clickHandlers = {}
	this.withJquery = (typeof jQuery !== 'undefined')
	this.options = {
		useSeparator 	: true,
		separatorHtml 	: null	// default from template
	}
	if (typeof E2 !== 'undefined') {
		this.get_uid 	= E2.core.get_uid	// used to attach onClick events at add/prepend time
		this._template 	= E2.views.partials.breadcrumb
	} else {
		var uid_c = 0						// server-side
		this.get_uid 	= function(){return ++uid_c}
		this._template 	= function(){return function(x){return (x)}}
	}

	if (this.withJquery && ($existingContainer instanceof jQuery)) {
		this.container = $existingContainer
		this._attach()
	} else {
		this.container = null	// only produce html
	}

	Object.defineProperty(this, 'length', {
		get: function(){return that.crumbs.length}
	})
}

UIbreadcrumb.prototype.getTemplateData = function() {
	return {
		options: this.options,
		crumbs: this.crumbs
	}
}

UIbreadcrumb.prototype.renderHtml = function() {
	return this._template(this.getTemplateData())
}

UIbreadcrumb.prototype.render = function($container) {	// optionally supply $container at last minute (client js only)
	if (this.withJquery) {
		if ($container instanceof jQuery) this.container = $container
		if (this.container) {
			this.container.html(this.renderHtml())
			this._attach()
			return this.container
		}
	}
	else return this.renderHtml()
}

UIbreadcrumb.prototype._attach = function() {
	this.container.find('a').off('.breadcrumb')
	this.container.find('a').on('click.breadcrumb', this.clickHandler.bind(this))
}

UIbreadcrumb.prototype.destroy = function() {
	if (this.withJquery && this.container) {
		this.container.find('a').off('.breadcrumb')
		this.container.html('')
	}
	this.clickHandlers = {}
	this.crumbs = []
	this.container = null
}

/**
 * add a new crumb
 * @param text
 * @param link optional
 * @param onClick optional
 * @param uid optional
 */
UIbreadcrumb.prototype.add = function(text, link, onClick, uid) {
	this.crumbs.push(
		this._makeCrumb(text, link, onClick, uid)
	)
	return this
}

UIbreadcrumb.prototype.prepend = function(text, link, onClick, uid) {
	this.crumbs.unshift(
		this._makeCrumb(text, link, onClick, uid)
	)
	return this
}

UIbreadcrumb.prototype._makeCrumb = function(text, linkHref, onClick, uid) {
	uid = uid || ('bc'+this.get_uid())
	linkHref = linkHref || ''
	if (typeof onClick === 'function') {
		this.clickHandlers[uid] = onClick
		if (linkHref === '') linkHref = '#'
	}
	return {
		uid: uid,
		link: linkHref,
		text: text
	}
}

UIbreadcrumb.prototype.clickHandler = function(e) {
	var domNode = e.currentTarget
	var $a = jQuery(domNode)
	var uid = $a.data('uid')
	if (uid && (typeof this.clickHandlers[uid] === 'function')) {
		this.clickHandlers[uid](domNode)
		e.preventDefault()
		e.stopPropagation()
		return false
	}
	else return true
}

if (typeof module !== 'undefined')
	module.exports = UIbreadcrumb