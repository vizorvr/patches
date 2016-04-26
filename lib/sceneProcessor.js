var fs = require('fs')
var fsPath = require('path')
var when = require('when')
var yauzl = require('yauzl')

var mainFileExtensions = ['.obj', '.js', '.json', '.gltf', '.fbx', '.dae']
var allowedExtensions = [
	'.jpg', '.jpeg', '.png', '.tga', '.mtl', '.dds',
	'.bin', '.glsl'
	]
	.concat(mainFileExtensions)

function SceneProcessor(storage) {
	if (!storage)
		throw new Error('SceneProcessor got no storage');
	this._fs = storage;
}

SceneProcessor.prototype.validate = function(file) {
	var dfd = when.defer();
	var jsonFound = false;

	var extname = fsPath.extname(file.path.toLowerCase())
	
	if (extname === '.zip') {
		yauzl.open(file.path, function(err, zip) {
			if (err)
				return dfd.reject(err)
			
			zip.on('entry', function(entry) {
				entry.path = entry.fileName

				var entryExtName = fsPath.extname(entry.path.toLowerCase())
				if (mainFileExtensions.indexOf(entryExtName))
					jsonFound = true
			})
			.on('error', function(err) {
				console.error(err)
				dfd.resolve(false)
			})
			.on('close', function() {
				dfd.resolve(jsonFound)
			})
		})
	} else {
		dfd.resolve(mainFileExtensions.indexOf(extname) !== -1)
	}

	return dfd.promise
}

SceneProcessor.prototype.handleUpload = function(file, sceneFolder) {
	var that = this;
	var extname = fsPath.extname(file.path.toLowerCase())

	return this.validate(file)
	.then(function() {
		if (extname === '.zip')
			return that.processZipUpload(file, sceneFolder)

		if (mainFileExtensions.indexOf(extname) === -1)
			return new Error('We support the following file formats: ' + mainFileExtensions.join(', '))

		var stream = fs.createReadStream(file.path)
		var destPath = sceneFolder + '/' + fsPath.basename(file.path)

		return that.processUploadedFile(stream, destPath)
	})
}

SceneProcessor.prototype.processUploadedFile = function(stream, destPath) {
	var that = this
	var dfd = when.defer()

	this._fs.createWriteStream(destPath)
	.then(function(writeStream) {
		stream.pipe(writeStream)
		.on('error', function(err) {
			dfd.reject(err)
		})
		.on('close', function() {
			dfd.resolve({
				path: destPath,
				url: that._fs.url(destPath),
				files: [ destPath ]
			})
		})
	})

	return dfd.promise
}

SceneProcessor.prototype.processZipUpload = function(file, sceneFolder) {
	var dfd = when.defer()
	var that = this
	var files = []
	var mainFile

	var processing = 0
	var closed = false

	yauzl.open(file.path, function(err, zip) {
		if (err)
			return dfd.reject(err)
		
		function handleError(err) {
			zip.close()
			dfd.reject(err)			
		}
		
		zip.on('entry', function(entry) {
			entry.path = entry.fileName

			var extname = fsPath.extname(entry.path.toLowerCase())
			var basename = fsPath.basename(entry.path.toLowerCase())

			if (basename[0] === '.' || allowedExtensions.indexOf(extname) === -1) {
				return
			}

			if (mainFileExtensions.indexOf(extname) !== -1) {
				mainFile = fsPath.basename(entry.path)
			}

			zip.openReadStream(entry, function(err, readStream) {
				if (err)
					return handleError(err)

				var destPath = sceneFolder + '/' + fsPath.basename(entry.path)

				processing++

				that.processUploadedFile(readStream, destPath)
				.then(function(file) {
					files.push(file.path)

					processing--

					if (closed && !processing)
						dfd.resolve({
							path: sceneFolder,
							url: that._fs.url(sceneFolder + '/' + mainFile),
							files: files
						})
				})
				.catch(handleError)
			})
		})
		.on('error', handleError)
		.on('close', function() {
			closed = true
		})
		.on('end', function() {
			if (!mainFile) {
				return dfd.reject(
					new Error('Main object file (obj, json, js, ...) not found in upload'))
			}
		})
	})

	return dfd.promise;
}

module.exports = SceneProcessor;
