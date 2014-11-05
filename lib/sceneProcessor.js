var fs = require('fs');
var fsPath = require('path');
var when = require('when');
var nodefn = require('when/node');
var temp = require('temp').track();
var unzip = require('node-unzip-2'); // zomg best unzip package?

function SceneProcessor(storage) {
	if (!storage)
		throw new Error('SceneProcessor got no storage');
	this._fs = storage;
}

SceneProcessor.prototype.validate = function(file)
{
	var dfd = when.defer();
	var jsonFound = false;

	fs.createReadStream(file.path)
	.pipe(unzip.Parse())
	.on('entry', function(entry)
	{
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
		console.log('SceneProcessor.validate', file.path, jsonFound);
		dfd.resolve(jsonFound);
	});

	return dfd.promise;
}

SceneProcessor.prototype.handleUpload = function(file, sceneFolder)
{
	var dfd = when.defer();
	var that = this;
	var files = [];

	fs.createReadStream(file.path)
	.pipe(unzip.Parse())
	.on('entry', function (entry)
	{
		if (entry.type !== 'File') // Directory or File
			return;

		var fileName = entry.path;
		var size = entry.size;

		var out = fsPath.join(sceneFolder, fsPath.basename(entry.path));

		console.log('SceneProcessor.handleUpload', out);

		that._fs.createWriteStream(out)
		.then(function(stream)
		{
			entry.pipe(stream);
			files.push(out);
		});
	})
	.on('error', function(err)
	{
		dfd.reject(err);
	})
	.on('close', function()
	{
		dfd.resolve({
			path: sceneFolder,
			url: that._fs.url(sceneFolder + '/scene.json'),
			files: files
		});
	})

	return dfd.promise;
}

module.exports = SceneProcessor;
