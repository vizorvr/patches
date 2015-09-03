var fs = require('fs');
var fsPath = require('path');
var when = require('when');
var unzip = require('node-unzip-2');

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
		fs.createReadStream(file.path)
		.pipe(unzip.Parse())
		.on('entry', function(entry) {
			if (entry.path.slice(-10).toLowerCase() === 'scene.json')
				jsonFound = true;

			entry.autodrain();
		})
		.on('error', function(err) {
			console.error(err)
			dfd.resolve(false);
		})
		.on('close', function() {
			dfd.resolve(jsonFound);
		})
	} else {
		var allowedExtensions = ['.obj', '.js', '.json']
		dfd.resolve(allowedExtensions.indexOf(extname) !== -1)
	}

	return dfd.promise;
}

SceneProcessor.prototype.handleUpload = function(file, sceneFolder) {
	var that = this;
	var extname = fsPath.extname(file.path.toLowerCase())

	return this.validate(file)
	.then(function() {
		if (extname === '.zip')
			return that.processZipUpload(file, sceneFolder)

		if (extname !== '.obj' && extname !== '.json')
			return new Error('SceneProcessor.handleUpload: Only OBJ, ZIP and JSON supported')

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
			console.log('processUploadedFile', {
				path: destPath,
				url: that._fs.url(destPath),
				files: [ destPath ]
			})
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
	var files = [];
	var allowedExtensions = ['.obj', '.jpg', '.png', '.json', '.mtl']
	var mainFileExtensions = ['.obj', '.json']
	var mainFile

	fs.createReadStream(file.path)
		.pipe(unzip.Parse())
		.on('entry', function(entry) {
			var extname = fsPath.extname(entry.path.toLowerCase())

			if (entry.type !== 'File' || allowedExtensions.indexOf(extname) === -1)
				return

			if (mainFileExtensions.indexOf(extname) !== -1)
				mainFile = fsPath.basename(entry.path)

			var destPath = sceneFolder + '/' + fsPath.basename(entry.path)

			that.processUploadedFile(entry, destPath)
			.then(function() {
				files.push(destPath)
			})
			.catch(dfd.reject.bind(dfd));
		})
		.on('error', function(err) {
			dfd.reject(err);
		})
		.on('close', function() {
			if (!mainFile) {
				return dfd.reject(
					new Error('Main object file (obj, json, ...) not found in upload'))
			}

			dfd.resolve({
				path: sceneFolder,
				url: that._fs.url(sceneFolder + '/' + mainFile),
				files: files
			});
		});

		return dfd.promise;

}

module.exports = SceneProcessor;
