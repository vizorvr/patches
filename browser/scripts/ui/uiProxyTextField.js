var UITextField = function UITextField() {
	UIAbstractProxy.apply(this, arguments)
}
UITextField.prototype = Object.create(UIAbstractProxy.prototype)
UITextField.prototype.constructor = UITextField

UITextField.prototype.getAdapter = function(obj, propertyName){
	var that = this
	return {
		get sourceValue() {
			var sv = obj[propertyName]
			return (sv || (sv === 0)) ? sv.toString() : ''
		},
		set sourceValue(v) {
			return obj[propertyName] = v.toString()
		},
		get uiValue() {
			return that.element.value
		},
		set uiValue(v) {
			return that.element.value = v
		}
	}
}

UITextField.prototype.newElement = function() {
	var domElement = document.createElement('INPUT')
	domElement.setAttribute('type', 'text')
	return domElement
}

UITextField.prototype.checkValidElement = function(domElement) {
	 return (domElement.tagName === 'INPUT')  &&  (domElement.getAttribute('type') === 'text')
}



var UIFloatField = function UIFloatField() {
	this.precision = 2	// .toFixed(N)
	UITextField.apply(this, arguments)
}
UIFloatField.prototype = Object.create(UITextField.prototype)
UIFloatField.prototype.constructor = UIFloatField
UIFloatField.prototype.getAdapter = function(obj, propertyName){
	var that = this
	return {
		get sourceValue() {
			var sv = obj[propertyName]
			return (sv || (sv === 0)) ? sv : ''
		},
		set sourceValue(v) {
			return obj[propertyName] = v ? parseFloat(v) : v
		},
		get uiValue() {
			var v = parseFloat(that.element.value)
			return (!isNaN(v)) ? v : null
		},
		set uiValue(v) {
			if (v || v === 0)
				return that.element.value = !isNaN(v) ? v.toFixed(that.precision) : ''
			return ''
		}
	}
}
