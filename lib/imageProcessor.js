var gm = require('gm');
var fs = require('fs');
var fsPath = require('path');
var mime = require('mime');
var when = require('when');
var nodefn = require('when/node');
var temp = require('temp').track();
var _ = require('lodash');

var thumbSize = 128;
var thumbnailThreshold = 128 * 128;
var log2 = Math.log(2);

function isPow2(number)
{
  return number !== 0 && (number & number-1) === 0;
}

function nearestPower(number)
{
	return Math.pow(2, Math.floor(Math.log(number) / log2));
}

function ImageProcessor(storage) {
	this._storage = storage;
}

ImageProcessor.prototype.analyze = function(path, versionName)
{
	return nodefn.call(fs.stat, path)
	.then(function(stat)
	{
		var dfd = when.defer();
		gm(path).size(function(err, info)
		{
			if (err) return dfd.reject(err);
			info.size = stat.size;
			dfd.resolve(info);
		})
		return dfd.promise;
	})
	.then(function(info)
	{
		return {
			path: path,
			bytes: info.size,
			mimetype: mime.lookup(path),
			name: versionName,	
			width: info.width,
			height: info.height
		};
	});
}

ImageProcessor.prototype.process = function(path, originalName, thumbName)
{
	var that = this;
	var originalInfo;

	return this.analyze(path, originalName)
	.then(function(info)
	{
		originalInfo = info;
		return that.storeImage(info);
	})
	.then(function(info)
	{
		var imageSize = info.width * info.height;

		if (imageSize > thumbnailThreshold)
		{
			return that.generateThumbnail(path, thumbName)
		} else {
			// use original as thumbnail
			var thumbInfo = _.clone(originalInfo);
			thumbInfo.name = thumbName;
			return thumbInfo;
		}
	})
	.then(function(thumbInfo)
	{
		return { original: originalInfo, thumbnail: thumbInfo };
	});
}

ImageProcessor.prototype.handleUpload = function(file)
{
	var that = this;

	var ext = fsPath.extname(file.path);
	var name = fsPath.basename(file.path, ext);
	var originalName = name + ext;
	var thumbName = name + '-thumb' + ext;
	var scaledName = name + '-pow' + ext;
	var scaledThumbName = name + '-pow-thumb' + ext;

	return this.process(file.path, originalName, thumbName)
	.then(function(info)
	{
		if (!isPow2(info.original.height) || !isPow2(info.original.width))
		{
			return that.createPowerOfTwoImage(info.original)
			.then(function(p2)
			{
				return that.process(p2, scaledName, scaledThumbName);
			})
			.then(function(p2info)
			{
				info.scaled = p2info.original;
				info.scaledThumbnail = p2info.thumbnail;
				return info;
			})
		} else {
			info.scaled = _.clone(info.original);
			info.scaledThumbnail = _.clone(info.thumbnail);
			info.scaled.name = scaledName;
			info.scaledThumbnail.name = scaledThumbName;
		}

		return info;
	});
}

ImageProcessor.prototype.createPowerOfTwoImage = function(orig)
{
	var that = this;
	var dfd = when.defer();
	var tempPath = temp.path({suffix: fsPath.extname(orig.path)});

	gm(orig.path)
		.resize(nearestPower(orig.width), nearestPower(orig.height), '!')
		.write(tempPath, function(err)
		{
			if (err) return dfd.reject(err);
			dfd.resolve(tempPath);
		}
	);

	return dfd.promise;	
}

ImageProcessor.prototype.storeImage = function(info)
{
	return this._storage.write(info.path)
	.then(function(url)
	{
		info.url = url;
		return info;
	});
}

ImageProcessor.prototype.generateThumbnail = function(path, name)
{
	var that = this;
	var dfd = when.defer();
	var tempPath = temp.path({suffix: fsPath.extname(path)});

	gm(path).thumb(thumbSize, thumbSize, tempPath, 100, function(err)
	{
		if (err) return dfd.reject(err);

		that.analyze(tempPath, name)
		.then(that.storeImage.bind(that))
		.then(function(thumbInfo)
		{
			fs.unlink(tempPath);
			dfd.resolve(thumbInfo);
		});
	});

	return dfd.promise;	
}

module.exports = ImageProcessor;

