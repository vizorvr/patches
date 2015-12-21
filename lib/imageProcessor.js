var gm = require('gm')
var fs = require('fs-extra')
var fsPath = require('path')
var mime = require('mime')
var when = require('when')
var nodefn = require('when/node')
var temp = require('temp').track()
var _ = require('lodash')
var checksum = require('checksum')

var thumbSize = 128
var thumbnailThreshold = 128 * 128
var log2 = Math.log(2)

function isPow2(number) {
  return number !== 0 && (number & number-1) === 0
}

function nearestPower(number) {
	return Math.pow(2, Math.floor(Math.log(number) / log2))
}

function ImageProcessor(storage) {
	if (!storage)
		throw new Error('ImageProcessor got no storage')

	this._storage = storage
}

ImageProcessor.prototype.analyze = function(path) {
	// console.log('ImageProcessor.analyze', path)

	return nodefn.call(fs.stat, path)
	.then(function(stat) {
		var dfd = when.defer()
		gm(path).size(function(err, info) {
			if (err)
				return dfd.reject(err)
			info.size = stat.imageSizeq
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
		return {
			bytes: info.size,
			mimetype: mime.lookup(path),
			width: info.width,
			height: info.height,
			sha1: info.sha1
		}
	})
}

ImageProcessor.prototype.process = function(path, destPath, thumbPath) {
	// console.log('ImageProcessor.process', path)

	var that = this
	var originalInfo

	return this.analyze(path)
	.then(function(info) {
		originalInfo = info
		originalInfo.path = destPath

		var shaPath = '/image/'+info.sha1+fsPath.extname(path)
		return that.storeImage(path, shaPath)
	})
	.then(function(url) {
		originalInfo.url = url
		var imageSize = originalInfo.width * originalInfo.height

		if (imageSize > thumbnailThreshold) {
			return that.generateThumbnail(path, thumbPath)
		} else {
			// use original as thumbnail
			var thumbInfo = _.clone(originalInfo)
			return thumbInfo
		}
	})
	.then(function(thumbInfo) {
		return { original: originalInfo, thumbnail: thumbInfo }
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

ImageProcessor.prototype.handleUpload = function(file, destDir) {
	var that = this

	var ext = fsPath.extname(file.path)
	var name = fsPath.basename(file.path, ext)
	var originalName = fsPath.join(destDir, name + ext)
	var thumbName = fsPath.join(destDir, name + '-thumb.png')
	var scaledName = fsPath.join(destDir, name + '-scaled.png')
	var scaledThumbName = fsPath.join(destDir, name + '-scaled-thumb.png')
	var normalizedPath

	// normalize image to png
	return this.normalizeImage(file.path)
	.then(function(npath) {
		normalizedPath = npath
		return that.process(normalizedPath, originalName, thumbName)
	})
	.then(function(info) {
		// determine tags
		info.tags = ['texture']

		if (that.isCubeMap(info))
			info.tags = ['monocubemap']

		if (that.isStereoCubeMap(info))
			info.tags = ['stereocubemap']

		return info
	})
	.then(function(info) {
		if (that.needsScaling(info)) {
			return that.createPowerOfTwoImage(normalizedPath, info.original)
			.then(function(p2) {
				return that.process(p2, scaledName, scaledThumbName)
			})
			.then(function(p2info) {
				info.scaled = p2info.original
				info.scaledThumbnail = p2info.thumbnail
				return info
			})
		} else {
			info.scaled = _.clone(info.original)
			info.scaledThumbnail = _.clone(info.thumbnail)
			info.scaled.path = scaledName
			info.scaledThumbnail.path = scaledThumbName
		}

		return info
	})
}

ImageProcessor.prototype.normalizeImage = function(path) {
	var dfd = when.defer()
	var tempPath = temp.path({suffix: '.png'})

	gm(path).write(tempPath, function(err) {
		if (err) return dfd.reject(err)
		dfd.resolve(tempPath)
	})

	return dfd.promise	
}

ImageProcessor.prototype.createPowerOfTwoImage = function(path, info) {
	var dfd = when.defer()
	var tempPath = temp.path({suffix: fsPath.extname(path)})

	gm(path)
		.resize(nearestPower(info.width), nearestPower(info.height), '!')
		.write(tempPath, function(err) {
			if (err) return dfd.reject(err)
			dfd.resolve(tempPath)
		}
	)

	return dfd.promise	
}

ImageProcessor.prototype.storeImage = function(sourcePath, destinationPath) {
	// console.log('ImageProcessor.storeImage', sourcePath, destinationPath)
	return this._storage.copy(sourcePath, destinationPath)
}

ImageProcessor.prototype.generateThumbnail = function(path, thumbPath) {
	// console.log('ImageProcessor.generateThumbnail', path)
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

