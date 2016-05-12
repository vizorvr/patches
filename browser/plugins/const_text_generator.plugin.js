(function(){

var Text = E2.plugins.const_text_generator = function Text() {
	AbstractTextareaPlugin.apply(this, arguments)
	this.undoName = 'Text'
}

Text.prototype = Object.create(AbstractTextareaPlugin.prototype)
Text.prototype.constructor = Text

})()
