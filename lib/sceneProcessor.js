var fs = require('fs');
var fsPath = require('path');
var when = require('when');
var nodefn = require('when/node');
var temp = require('temp').track();
var unzip = require('node-unzip-2'); // zomg best unzip package?

function SceneProcessor(fsImpl) {
	this._fs = fsImpl;
}

SceneProcessor.prototype.validate = function(file)
{
	var dfd = when.defer();
	var jsonFound = false;

	fs.createReadStream(file.path)
	.pipe(unzip.Parse())
	.on('entry', function(entry)
	{
		console.log('entry', entry.path)
		if (entry.path.slice(-10).toLowerCase() === 'scene.json')
			jsonFound = true;

		entry.autodrain();
	})
	.on('error', function(err)
	{
		dfd.resolve(err);
	})
	.on('close', function()
	{
		dfd.resolve(jsonFound);
	})

	return dfd.promise;
}

SceneProcessor.prototype.handleUpload = function(file, scenePath)
{
	var dfd = when.defer();
	var that = this;

	fs.createReadStream(file.path)
	.pipe(unzip.Parse())
	.on('entry', function (entry)
	{
		console.log('zip entry', entry.path, entry.type);

		if (entry.type !== 'File') // Directory or File
			return;

		var fileName = entry.path;
		var size = entry.size;

		entry.pipe(that._fs.createWriteStream(scenePath));
	})
	.on('error', function(err)
	{
		dfd.reject(err);
	})
	.on('close', function()
	{
		dfd.resolve();
	})

	return dfd.promise;
}

module.exports = SceneProcessor;
