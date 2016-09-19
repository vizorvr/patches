(function() {

function ThreeSixty() {
	this.dispatcher = new Flux.Dispatcher()
}

ThreeSixty.prototype.init = function() {
	var that = this

	this.uploader = new ThreeSixtyUploader()
	this.uploader.on('uploaded', function(uploadedFile) {
		var imageUrl = uploadedFile.scaled.url
		return that.publisher.publishTemplateWithUrl(imageUrl)
	})

	this.publisher = new ThreeSixtyPublisher()
	this.ui = new ThreeSixtyUi(this.uploader, this.publisher)
	this.ui.init()
}

document.addEventListener('DOMContentLoaded', function() {
	E2.threesixty = new ThreeSixty()
	E2.threesixty.init()
})

})()
