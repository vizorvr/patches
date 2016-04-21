// allows a button to toggle an object var directly
var UIToggleButton = function UIToggleButton() {
	UIAbstractProxy.apply(this, arguments)
}
UIToggleButton.prototype = Object.create(UIAbstractProxy.prototype)
UIToggleButton.prototype.constructor = UIToggleButton

UIToggleButton.prototype.getAdapter = function(){
	var that = this
	var obj = this.obj, propertyName = this.propertyName
	return {
		get sourceValue() {
			return !!obj[propertyName]
		},
		set sourceValue(v) {
			return obj[propertyName] = !!v
		},
		get uiValue() {
			return that.element.dataset.state === 'on'
		},
		set uiValue(v) {
			that.element.dataset.state = (v) ? 'on' : 'off'
			that.element.classList.toggle('uiToggle_on', !!v)
			that.element.classList.toggle('uiToggle_off', !v)
			return that.element.dataset.state
		}
	}
}

UIToggleButton.prototype.newElement = function() {
	var domElement = document.createElement('BUTTON')
	domElement.dataset.state = 'off'
	domElement.className = 'uiToggle'
	return domElement
}

UIToggleButton.prototype.checkValidElement = function(domElement) {
	var typ = domElement.getAttribute('type') || ''
	return (domElement.tagName === 'BUTTON')  &&  (typ.toLowerCase() !== 'submit')
}

UIToggleButton.prototype.attach = function() {
	this._toggle = function(e) {
		this.adapter.uiValue = !this.adapter.uiValue
		this._onUIChange(e)
	}.bind(this)
	this.element.addEventListener('click', this._toggle)
}

UIToggleButton.prototype.detach = function() {
	if (this._toggle)
		this.element.removeEventListener('click', this._toggle)
}