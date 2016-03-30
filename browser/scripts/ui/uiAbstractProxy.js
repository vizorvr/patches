// base for all UIProxy controls
// bridge obj.propertyName and domElement
// so that UI interaction on domElement results in obj.propertyName being updated

var UIAbstractProxy = function UIAbstractProxy(obj, propertyName, domElement, onChange) {

	var that = this
	this._str = ''		// cache this.toString()

	this.uid = 'uiproxy_'+E2.uid()
	this.htmlId = false
	this.obj = obj
	this.propertyName = propertyName
	this._onChange = onChange
	this.element = null
	this._enabled = true
	this.isStillChanging = false

	// set these if needed before rendering html
	this.label = ''
	this.dt = null

	if (domElement) {
		this.element = this.render(domElement)
		this._attach()
	}

	return this
}

UIAbstractProxy.prototype.render = function(domElement) {
	if (domElement) {
		this.createdElement = false
		if (domElement.id) {
			this.htmlId = domElement.id
		} else {
			this.htmlId = this.uid
			domElement.id = this.uid
		}
		if (!this.checkValidElement(domElement))
			return null
		domElement.dataset.uid = this.uid
		return domElement
	} else {
		this.createdElement = true
		var el = this.newElement()
		this.htmlId = el.id = this.uid
		el.dataset.uid = this.uid
		return el
	}
}

// in case this is rendered some place else (e.g. handlebars),
// return html, adding a little script to attach event handlers automatically upon render
UIAbstractProxy.prototype.toString = function() {
	if (this._str !== '') {
		var uid = this.uid
		console.log('toString called more than once' + uid)
		return ''
	}
	var that = this
	if (this.element) return ''	// already rendered some place else

	var c = document.createElement('template')
	var el = this.render()
	c.content.appendChild(el)
	var str = c.innerHTML
	el.remove()
	c.remove()

	var d = {}
	d.listener = function(e) {
		if (!(e.detail && e.detail.htmlId === that.htmlId)) return
		document.removeEventListener('uiproxy_rendered', d.listener)
		document.getElementById('_js_'+that.uid).remove()
		that._attach()
		d = null
	}
	document.addEventListener('uiproxy_rendered', d.listener)

	// as soon as this element is rendered, we announce ourselves to the document
	str += "<script id='_js_"+ this.uid +"'>document.dispatchEvent(new CustomEvent('uiproxy_rendered', {detail:{htmlId:'" + this.htmlId + "'}}))</script>"
	this._str = str
	return this._str
}

UIAbstractProxy.prototype._getAdapter = function() {
	var adapter = this.getAdapter(this.obj, this.propertyName)
	return adapter
}

UIAbstractProxy.prototype._update = function() {
	this.adapter.uiValue = this.adapter.sourceValue
}

UIAbstractProxy.prototype._attach = function() {
	var el = document.getElementById(this.htmlId)
	if (el !== this.element) {
		this.element = el
	}
	this.adapter = this._getAdapter()
	this._onUIChange = function(e){
		var oldSourceValue = this.adapter.sourceValue
		if (!this.isEqualValue(this.adapter.uiValue, oldSourceValue)) {	// blur triggers onchange. avoid it.
			this.onUIChange(e)
			if (this._onChange)
				this._onChange.call(this, e, this.adapter.sourceValue, oldSourceValue)
		}
	}.bind(this)
	this.attach()
	this.onSourceChange()
	this.onEnabledChange()

	// release extra references
	this.obj = null
	this.propertyName = null
}

UIAbstractProxy.prototype._detach = function() {
	if (this.element)
		this.detach()
}


UIAbstractProxy.prototype.attach = function() {
	this.element.addEventListener('change', this._onUIChange)
}

UIAbstractProxy.prototype.detach = function() {
	this.element.removeEventListener('change', this._onUIChange)
}

UIAbstractProxy.prototype.isEqualValue = function(v1, v2) {
	return v1 === v2
}

/* overloaded methods */
UIAbstractProxy.prototype.getAdapter = function(obj, propertyName) {
	console.error('must override getAdapter')

	return {
		get sourceValue() 	{ /* return propertyName from obj via method or direct access */ },
		set sourceValue(v) 	{ /* set propertyName on obj directly or via some api */ },
		get uiValue() 		{ /* return the property of dom/ui element that represents the value */},
		set uiValue(v) 		{ /* change the dom/ui element to reflect value (e.g. .dataset.property, .className, etc)  */}
	}
}
UIAbstractProxy.prototype.checkValidElement = function() {return true}
/* end overloaded methods */
UIAbstractProxy.prototype.onUIChange = function() {
	this.adapter.sourceValue = this.adapter.uiValue
	if (this.element && this.element.blur)
		this.element.blur()
}

UIAbstractProxy.prototype.onSourceChange = function() {
	this._update()
	return true
}
UIAbstractProxy.prototype.onEnabledChange = function() {
	if (this.element)
		this.element.disabled = !this._enabled
}

UIAbstractProxy.prototype.enable = function() {
	this._enabled = true
	this.onEnabledChange()
}

UIAbstractProxy.prototype.disable = function() {
	this._enabled = false
	this.onEnabledChange()
}

UIAbstractProxy.prototype.destroy = function() {
	this._detach()
	if (this.createdElement) {
		var p = this.element.parentElement
		if (p) p.removeChild(this.element)
		this.element = null
	}
	this.adapter = null
}
