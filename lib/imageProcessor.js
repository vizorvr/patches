var gm = require('gm')
var fs = require('fs-extra')
var fsPath = require('path')
var mime = require('mime')
var when = require('when')
var nodefn = require('when/node')
var temp = require('temp').track()
var _ = require('lodash')
var checksum = require('checksum')
var exif = require('exiftool')

var thumbSize = 128
var thumbnailThreshold = 128 * 128
var log2 = Math.log(2)

function isPow2(number) {
  return number !== 0 && (number & number-1) === 0
}

function nearestPower(number) {
	return Math.pow(2, Math.round(Math.log(number) / log2))
}

function ImageProcessor(storage) {
	if (!storage)
		throw new Error('ImageProcessor got no storage')

	this._storage = storage
}

ImageProcessor.prototype.analyze = function(path) {
	return nodefn.call(fs.stat, path)
	.then(function(stat) {
		var dfd = when.defer()
		gm(path).size(function(err, info) {
			if (err)
				return dfd.reject(err)
			info.size = stat.size
			dfd.resolve(info)
		})
		return dfd.promise
	})
	.then(function(info) {
		return nodefn.call(checksum.file, path)
		.then(function(sum) {
			info.sha1 = sum
			return info
		})
	})
	.then(function(info) {
		// extract XMP from image
		return nodefn.call(fs.readFile, path)
		.then(function(data) {
			return nodefn.call(exif.metadata, data)
			.then(function(metadata) {
				if (metadata.accelerometer && metadata.compass) {
					var list = metadata.accelerometer.match(/-?\d+/g)
					info.rollDegrees = list[0]
					info.pitchDegrees = list[1]
					info.headingDegrees = metadata.compass
				}
				else if (metadata.posePitchDegrees && metadata.poseRollDegrees && metadata.poseHeadingDegrees) {
					info.rollDegrees = metadata.poseRollDegrees
					info.pitchDegrees = metadata.posePitchDegrees
					info.headingDegrees = metadata.poseHeadingDegrees
				}
				else if (metadata.ricohPitch && metadata.ricohRoll) {
					info.rollDegrees = metadata.ricohRoll
					info.pitchDegrees = metadata.ricohPitch
					info.headingDegrees = 0
				}

				return info
			})
		})
	})
	.then(function(info) {
		return {
			bytes: info.size,
			mimetype: mime.lookup(path),
			width: info.width,
			height: info.height,
			pitch: info.pitchDegrees,
			heading: info.headingDegrees,
			roll: info.rollDegrees,
			sha1: info.sha1
		}
	})
	.catch(function(err) {
		return err
	})
}

ImageProcessor.prototype.processScaled = function(path, destPath, thumbPath) {
	var that = this
	var scaledInfo

	return this.analyze(path)
	.then(function(info) {
		scaledInfo = info
		scaledInfo.path = destPath

		var shaPath = '/image/'+info.sha1+fsPath.extname(path)
		return that.storeImage(path, shaPath)
	})
	.then(function(url) {
		scaledInfo.url = url
		return that.generateThumbnail(path, thumbPath)
	})
	.then(function(thumbInfo) {
		return { scaled: scaledInfo, thumbnail: thumbInfo }
	})
}

ImageProcessor.prototype.processOriginal = function(path, destPath) {
	var that = this
	var info = {}

	return this.analyze(path)
	.then(function(analysis) {
		info.original = analysis
		info.original.path = destPath

		var shaPath = '/image/'+info.original.sha1+fsPath.extname(path)
		return that.storeImage(path, shaPath)
		.then(function(url) {
			info.original.url = url
			return info
		})
	})
}

ImageProcessor.prototype.processProfileImage = function(path, destPath) {
	var that = this
	var info = {}

	return this.analyze(path)
	.then(function(analysis) {
		info = analysis
		info.path = destPath

		return that.storeImage(path, destPath)
		.then(function(url) {
			info.url = url
			return info
		})
	})
}

ImageProcessor.prototype.isCubeMap = function(info) {
	return (info.original.width / info.original.height) === 6
}

ImageProcessor.prototype.isStereoCubeMap = function(info) {
	return (info.original.width / info.original.height) === 12
}

ImageProcessor.prototype.needsScaling = function(info) {
	var isScaled = isPow2(info.original.height) && isPow2(info.original.width)
	
	return !this.isCubeMap(info) && !this.isStereoCubeMap(info) && !isScaled
}

// called by handleUserAvatarUpload and handleUserHeaderUpload
ImageProcessor.prototype._handleProfileImageUpload = function(file, destDir, width, height) {
	var that = this

	var ext = fsPath.extname(file.path).toLowerCase()

	var destExt = '.png'
	if (ext === '.jpeg' || ext === '.jpg')
		destExt = '.jpg'

	var name = fsPath.basename(file.path, ext)
	var originalName = fsPath.join(destDir, name + destExt)
	var scaledName = fsPath.join(destDir, name + '-scaled'+ destExt)
	var normalizedPath

	var info = {}

	// normalize image to png or jpeg
	return this.normalizeImage(file.path)
	.then(function(npath) {
		normalizedPath = npath
		// analyse and store the original
		return that.processOriginal(normalizedPath, originalName)
	})
	// scale avatar
	.then(function(oinfo) {
		info.original = oinfo
		return that.createScaled(normalizedPath, width, height)
	})
	// analyse and store
	.then(function(scaledPath) {
		return that.processProfileImage(scaledPath, scaledName)
		.then(function(scaledInfo) {
			info.scaled = scaledInfo
			fs.unlink(scaledPath, function() {})
			return info
		})
	})
}

ImageProcessor.prototype.handleUserAvatarUpload = function(file, destDir) {
	return this._handleProfileImageUpload(file, destDir, 128, 128)
}
ImageProcessor.prototype.handleUserHeaderUpload = function(file, destDir) {
	return this._handleProfileImageUpload(file, destDir, 1440, 340)
}

ImageProcessor.prototype.createScaled = function(path, width, height) {
	var dfd = when.defer()
	var tempPath = temp.path({ suffix: fsPath.extname(path) })

	gm(path)
		.resize(width, height, '^>')
		.gravity('Center')
		.crop(width, height)
		.write(tempPath, function(err) {
			if (err)
				return dfd.reject(err)

			dfd.resolve(tempPath)
		}
	)

	return dfd.promise	
}

// regular asset uploads
ImageProcessor.prototype.handleUpload = function(file, destDir) {
	var that = this

	var ext = fsPath.extname(file.path).toLowerCase()

	var destExt = '.png'
	if (ext === '.jpeg' || ext === '.jpg')
		destExt = '.jpg'

	var name = fsPath.basename(file.path, ext)
	var originalName = fsPath.join(destDir, name + destExt)
	var scaledName = fsPath.join(destDir, name + '-scaled'+ destExt)
	var scaledThumbName = fsPath.join(destDir, name + '-scaled-thumb.png')
	var normalizedPath

	var info = {}

	// normalize image to png or jpeg
	return this.normalizeImage(file.path)
	.then(function(npath) {
		normalizedPath = npath
		// analyse and store the original
		return that.processOriginal(normalizedPath, originalName)
	})
	.then(function(analysis) {
		info = analysis

		// determine tags
		info.tags = ['texture']

		if (that.isCubeMap(info))
			info.tags = ['monocubemap']

		if (that.isStereoCubeMap(info))
			info.tags = ['stereocubemap']
	})
	// scale original if needed
	.then(function() {
		if (that.needsScaling(info)) {
			return that.createPowerOfTwoImage(normalizedPath, info.original)
		} else {
			return normalizedPath
		}
	})
	// thumbnail the scaled image
	.then(function(powerOfTwo) {
		return that.processScaled(powerOfTwo, scaledName, scaledThumbName)
		.then(function(p2info) {
			info.scaled = p2info.scaled
			info.scaledThumbnail = p2info.thumbnail
			info.scaled.path = scaledName
			info.scaledThumbnail.path = scaledThumbName
			return info
		})
	})
}

function copyImage(path, destPath) {
	var dfd = when.defer()
	fs.copy(path, destPath, { clobber: true }, function(err) {
		if (err)
			return dfd.reject(err)
		dfd.resolve(destPath)
	})
	return dfd.promise
}

ImageProcessor.prototype.normalizeImage = function(path) {
	var dfd = when.defer()
	var suffix = fsPath.extname(path).toLowerCase()

	// use the image directly if it can be
	var usableTypes = ['.jpg', '.jpeg', '.png']
	if (usableTypes.indexOf(suffix) !== -1) {
		return copyImage(path, temp.path({ suffix: suffix }))
	}

	// otherwise, convert to PNG
	var tempPath = temp.path({ suffix: '.png' })

	gm(path).write(tempPath, function(err) {
		if (err)
			return dfd.reject(err)

		dfd.resolve(tempPath)
	})

	return dfd.promise	
}

ImageProcessor.prototype.createPowerOfTwoImage = function(path, info) {
	var dfd = when.defer()
	var tempPath = temp.path({ suffix: fsPath.extname(path) })

	gm(path)
		.resize(nearestPower(info.width), nearestPower(info.height), '!')
		.write(tempPath, function(err) {
			if (err)
				return dfd.reject(err)

			dfd.resolve(tempPath)
		}
	)

	return dfd.promise	
}

ImageProcessor.prototype.storeImage = function(sourcePath, destinationPath) {
	return this._storage.copy(sourcePath, destinationPath)
}

ImageProcessor.prototype.generateThumbnail = function(path, thumbPath) {
	var that = this
	var thumbInfo
	var dfd = when.defer()
	var tempPath = temp.path({suffix: fsPath.extname(path)})

	gm(path)
	.resize(thumbSize, thumbSize)
	.write(tempPath, function(err) {
		if (err) return dfd.reject(err)

		that.analyze(tempPath)
		.then(function(info) {
			thumbInfo = info
			thumbInfo.path = thumbPath
			var shaPath = '/image/'+info.sha1+fsPath.extname(path)
			return that.storeImage(tempPath, shaPath)
		})
		.then(function(url) {
			thumbInfo.url = url
			fs.unlink(tempPath)
			dfd.resolve(thumbInfo)
		})
	})

	return dfd.promise	
}

module.exports = ImageProcessor

