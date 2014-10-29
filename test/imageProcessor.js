var ImageProcessor = require('../lib/imageProcessor');
var when = require('when');
var nodefn = require('when/node');
var assert = require('assert');
var fsPath = require('path');
var fs = require('fs-extra');

var images = {
	large: {
			name: 'te-2rb.jpg',
			path: __dirname+'/fixtures/te-2rb.jpg'
	},
	largeTexture: {
			name: 'no_texture.png',
			path: __dirname+'/../browser/images/no_texture.png'
	},
	small: {
			name: 'engilogo.png',
			path: __dirname+'/../browser/images/engilogo.png'
	}
};

describe('ImageProcessor', function()
{
	var imp, upload;

	beforeEach(function()
	{
		imp = new ImageProcessor({
			copy: function(sourcePath, destination)
			{
				var dfd = when.defer();
				// nodefn.call(fs.copy, path, '/tmp/foo/'+name)
				// .then(function() { return path; });
				dfd.resolve();
				return dfd.promise;
			}
		});
	});

	it('analyzes image correctly', function(done)
	{
		imp.handleUpload(images.small)
		.then(function(data) {
			assert.equal(data.original.width, 164);
			assert.equal(data.original.height, 164);
			done();
		})
		.catch(done)
	});

	it('skips thumbnailing if below threshold', function(done)
	{
		imp.handleUpload(images.small)
		.then(function(data) {
			assert.equal(data.scaled.url, data.scaledThumbnail.url);
			done();
		})
		.catch(done)
	});

	it('maintains aspect ratio for thumbnail', function(done)
	{
		imp.handleUpload(images.large)
		.then(function(data) {
			assert.equal(data.thumbnail.width, 128);
			assert.equal(data.thumbnail.height, 72);
			done();
		})
		.catch(done)
	});

	it('generates the right versions for large', function(done)
	{
		imp.handleUpload(images.large)
		.then(function(data) {
			assert.equal(data.original.width, 1920);
			assert.equal(data.thumbnail.width, 128);
			assert.equal(data.scaled.width, 1024);
			assert.equal(data.scaledThumbnail.width, 128);
			done();
		})
		.catch(done)
	});

	it('generates the right versions for large texture', function(done)
	{
		imp.handleUpload(images.largeTexture)
		.then(function(data) {
			assert.equal(data.original.width, 256);
			assert.equal(data.thumbnail.width, 128);
			assert.equal(data.scaled.width, 256);
			assert.equal(data.scaledThumbnail.width, 128);
			done();
		})
		.catch(done)
	});

	it('generates the right versions for small', function(done)
	{
		imp.handleUpload(images.small)
		.then(function(data) {
			assert.equal(data.original.width, 164);
			assert.equal(data.thumbnail.width, 128);
			assert.equal(data.scaled.width, 128);
			assert.equal(data.scaledThumbnail.width, 128);
			done();
		})
		.catch(done)
	});
});
