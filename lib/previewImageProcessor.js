var gm = require('gm')
var when = require('when')
var nodefn = require('when/node')

function PreviewImageProcessor() {
	this.defaultImage = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQ" +
	"VQokWP8z0AaYCJR/aiGUQ1DSAMAQC4BH5CRCM8AAAAASUVORK5CYII="
}

PreviewImageProcessor.prototype.process = function(path, image) {
	var dfd = when.defer()

	if (image) {
		var imgString = image.replace(/^data:image\/\w+;base64,/, "")
		var imgData = new Buffer(imgString, 'base64')

		var that = this

		gm(imgData, "img.png").flip().toBuffer('PNG', function(err, buffer) {
			if (err) {
				console.log('PreviewImageProcessor: Failed to upload image', path)
				dfd.resolve(that.defaultImage)
			}

			var str = buffer.toString('base64')
			dfd.resolve(str)
		})

	}
	else {
		// default image
		dfd.resolve(this.defaultImage)
	}

	return dfd.promise
}

module.exports = PreviewImageProcessor

