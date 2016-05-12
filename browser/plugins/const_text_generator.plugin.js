(function(){

var Text = E2.plugins.const_text_generator = function Text() {
	AbstractTextAreaPlugin.apply(this, arguments)
	this.undoName = 'Text'
}

Text.prototype = Object.create(AbstractTextAreaPlugin.prototype)
Text.prototype.constructor = Text

})()
