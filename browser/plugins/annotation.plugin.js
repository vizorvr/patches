(function(){

var Annotation = E2.plugins.annotation = function Annotation() {
	AbstractTextAreaPlugin.apply(this, arguments)
	this.desc = 'Add textual hints to the graph.'
	this.undoName = 'Annotation'
	this.input_slots = []
	this.output_slots = []
}

Annotation.prototype = Object.create(AbstractTextAreaPlugin.prototype)
Annotation.prototype.constructor = Annotation

})()
