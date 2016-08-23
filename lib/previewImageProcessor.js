var gm = require('gm')
var when = require('when')
var nodefn = require('when/node')

function PreviewImageProcessor() {
}

PreviewImageProcessor.prototype.process = function(path, image, previewSizes) {
	var dfd = when.defer()

	if (!image) {
		console.error('PreviewImageProcessor: failed to upload image', path, 'no image')

		dfd.resolve()
	}
	else {
		var imgString = image.replace(/^data:image\/\w+;base64,/, "")
		var imgData = new Buffer(imgString, 'base64')

		var that = this

		var resultImages = []

		// fill in resultImages with converted versions

		function createImages(images) {
			return images.reduce(function(promise, imageInfo) {
				return promise.then(function() {
					var dfd = when.defer()

					gm(imgData, "img.png")
					.identify(function(err, data) {

						if (err) {
							console.error('PreviewImageProcessor: Failed to upload image', path, err)
							dfd.resolve()
							return
						}

						var aspect = data.size.width / data.size.height

						gm(imgData, "img.png")
						.flip()
						.resize(imageInfo.height * aspect, imageInfo.height)
						.crop(imageInfo.width, imageInfo.height, (imageInfo.height * aspect - imageInfo.width) / 2, 0)
						.interlace('Line')
						.toBuffer('PNG', function(err, buffer) {
							if (err) {
								console.error('PreviewImageProcessor: Failed to upload image', path, err)
								dfd.resolve()
								return
							}

							resultImages.push(buffer.toString('base64'))
							dfd.resolve()
						})
					})

					return dfd.promise
				})
			}, Promise.resolve())
		}

		createImages(previewSizes).then(function() {
			dfd.resolve(resultImages)
		})
	}

	return dfd.promise
}

module.exports = PreviewImageProcessor

