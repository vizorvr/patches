(function() {

function ThreeSixtyUploader() {}

ThreeSixtyUploader.prototype = Object.create(EventEmitter.prototype)

ThreeSixtyUploader.prototype.cancelledUploading = function() {
	if (this.fakeProgressBarId)
		clearTimeout(this.fakeProgressBarId)

	this.emit('cancelled')

	return false
}

ThreeSixtyUploader.prototype.errorHandler = function(err) {
	this.cancelledUploading()
	this.emit('error', err)
}

ThreeSixtyUploader.prototype.fileSelectHandler = function(e) {
	e.stopPropagation()
	e.preventDefault()

	// Either read from the dataTransfer (when drag and dropped)
	// or from the target.files (when file browsed)

	var filePath = (e.dataTransfer) ? e.dataTransfer.files : e.target.files

	if (!filePath)
		return

	filePath = filePath[0]

	if (filePath && filePath.type.match('image.*') === null) {
		this.cancelledUploading()
		return this.fileUploadErrorWrongType(filePath)
	}

	E2.track({ 
		event: 'ThreeSixty Uploading',
		filePath: filePath,
		fileType: filePath.type
	})

	this.uploadFile(filePath, 'image')
		.then(function(uploadedFile) {
			if (uploadedFile) {
				E2.track({ 
					event: 'ThreeSixty Uploaded', 
					filePath: filePath,
					uploadedFile: uploadedFile
				})

				that.emit('uploaded', uploadedFile)
			} else {
				return when.reject()
			}
		})
		.catch(this.errorHandler.bind(this))

	return false
}

ThreeSixtyUploader.prototype.fileUploadErrorWrongType = function(filePath) {
	E2.track({ 
		event: 'ThreeSixty Error Wrong File Type', 
		type: 'error',
		filePath: filePath,
		fileType: filePath.type
	})

	this.errorHandler(new Error('File type does not match - accepted file types are .jpg and .jpeg'))

	return false
}

// STEP 1
ThreeSixtyUploader.prototype.uploadFile = function(file, modelName) {
	var that = this

	var dfd = when.defer()

	var formData = new FormData()
	formData.append('filename', file.name)
	formData.append('file', file)

	var fakeMin = 30
	var fakeMax = 50
	var fakeInc = (fakeMax - fakeMin) / 1000
	var fakeInterval = 1000/60

	function fakeProgressBar() {
		var currVal = $progress.val()
		if (currVal < fakeMax) {
			that.emit('progress', currVal + fakeInc)
			that.fakeProgressBarId = setTimeout(fakeProgressBar, fakeInterval)
		}
		else if (that.fakeProgressBarId) {
			that.clearTimeout(that.fakeProgressBarId)
		}
	}

	this.emit('beforeUpload')

	$.ajax({
		url: '/uploadAnonymous/' + modelName,
		type: 'POST',
		data: formData,
		cache: false,
		contentType: false,
		processData: false,
		dataType: 'json',

		xhr: function() {
			var xhr = $.ajaxSettings.xhr()
				xhr.upload.addEventListener('loadstart', function() {
					that.emit('uploading')
				}, false)

				xhr.upload.addEventListener('progress', function(evt) {
					if (evt.lengthComputable) {
						// Limit this to fakeMin, we continue with the player core progress
						// from there
						var percent = Math.floor(evt.loaded/evt.total * 100) * (fakeMin / 100)
						that.emit('progress', percent)

						// we've gone over 100 already on the upload, start the fake progress
						if (percent >= fakeMin) {
							// that.fakeProgressBarId = setTimeout(fakeProgressBar, fakeInterval)
						}
					}
				}, false)

				xhr.upload.addEventListener('load', function() {
					that.emit('progress', 50)
				}, false)

			return xhr
		},

		success: function(uploadedFile) {
			dfd.resolve(uploadedFile)
		},

		error: function(err, text_status) {
			if (text_status === "abort") {
				// http://paulrademacher.com/blog/jquery-gotcha-error-callback-triggered-on-xhr-abort/
				E2.track({ event: 'ThreeSixty Cancelled Uploading' })
				return
			}

			var errMsg = err.responseJSON ? err.responseJSON.message : err.status
			that.cancelledUploading()
	
			E2.track({ 
				event: 'ThreeSixty Error Uploading', 
				type: 'error',
				error: errMsg
			})

			dfd.reject('Could not upload file', errMsg)
		}
	})

	return dfd.promise
}

// STEP 3
// POST graph to the server
ThreeSixtyUploader.prototype.uploadGraph = function(graphData, callback) {
	var dfd = when.defer()

	clearBodyClass()
	$body.addClass('uploading')

	E2.track({ event: 'ThreeSixty Uploading Graph' })

	var previewImage = E2.app.player.getScreenshot(1280, 720)

	$.ajax({
		url: '/graph/v',
		type: 'POST',
		data: { 
			previewImage: previewImage,
			graph: graphData
		},
		dataType: 'json',
		success: function(response) {
			E2.track({
				event: 'ThreeSixty Uploaded Graph', 
				path: response.path
			})

			callback(response)

			dfd.resolve()
		},
		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err.status

			E2.track({
				event: 'ThreeSixty Error Uploading Graph',
				type: 'error',
				error: errMsg
			})

			alert('Sorry, an error occurred while uploading the file.')

			dfd.reject('Could not post file', errMsg)
		}
	})

	return dfd.promise
}

window.ThreeSixtyUploader = ThreeSixtyUploader

})()
