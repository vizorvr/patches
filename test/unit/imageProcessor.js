var ImageProcessor = require('../../lib/imageProcessor')
var when = require('when')
var nodefn = require('when/node')
var assert = require('assert')
var fsPath = require('path')
var fs = require('fs-extra')

var images = {
	large: {
			name: 'te-2rb.jpg',
			path: __dirname+'/../fixtures/te-2rb.jpg'
	},
	largeTexture: {
			name: 'no_texture.png',
			path: __dirname+'/../../browser/images/no_texture.png'
	},
	small: {
			name: 'engilogo.png',
			path: __dirname+'/../../browser/images/engilogo.png'
	}
}

describe('ImageProcessor', function() {
	var imp, upload

	beforeEach(function() {
		imp = new ImageProcessor({
			copy: function(sourcePath, destination) {
				var dfd = when.defer()
				// nodefn.call(fs.copy, path, '/tmp/foo/'+name)
				// .then(function() { return path })
				dfd.resolve('/files'+destination)
				return dfd.promise
			}
		})
	})

	it('analyzes image correctly', function(done) {
		imp.analyze(images.small.path)
		.then(function(data) {
			console.log('data', data)
			assert.equal(data.width, 164)
			assert.equal(data.height, 164)
			assert.equal(data.sha1, 'f09d10f5fa34355c597ad20294f4542ebe3111cc')
			done()
		})
		.catch(done)
	})

	it('skips thumbnailing if below threshold', function(done) {
		imp.handleUpload(images.small, 'foo')
		.then(function(data) {
			assert.equal(data.scaled.url, data.scaledThumbnail.url)
			done()
		})
		.catch(done)
	})

	it('maintains aspect ratio for thumbnail', function(done) {
		imp.handleUpload(images.large, 'foo')
		.then(function(data) {
			assert.equal(data.thumbnail.width, 128)
			assert.equal(data.thumbnail.height, 72)
			done()
		})
		.catch(done)
	})

	it('generates the right versions for large', function(done) {
		imp.handleUpload(images.large, 'foo')
		.then(function(data) {
			assert.equal(data.original.width, 1920)
			assert.equal(data.thumbnail.width, 128)
			assert.equal(data.scaled.width, 1024)
			assert.equal(data.scaledThumbnail.width, 128)
			done()
		})
		.catch(done)
	})

	it('generates the right versions for large texture', function(done) {
		imp.handleUpload(images.largeTexture, 'foo')
		.then(function(data) {
			assert.equal(data.original.width, 256)
			assert.equal(data.thumbnail.width, 128)
			assert.equal(data.scaled.width, 256)
			assert.equal(data.scaledThumbnail.width, 128)
			done()
		})
		.catch(done)
	})

	it('generates the right versions for small', function(done) {
		imp.handleUpload(images.small, 'foo')
		.then(function(data) {
			assert.equal(data.original.width, 164)
			assert.equal(data.thumbnail.width, 128)
			assert.equal(data.scaled.width, 128)
			assert.equal(data.scaledThumbnail.width, 128)
			done()
		})
		.catch(done)
	})

	it('puts the files in the right places', function(done) {
		imp.handleUpload(images.large, '/images')
		.then(function(data) {
			var fplen = '/files/image/abc83484eec1f6e0e597147c47978488ef39e795.png'.length
			assert.equal(data.original.path, '/images/te-2rb.jpg')
			assert.equal(data.original.url.length, fplen)
			assert.equal(data.thumbnail.path, '/images/te-2rb-thumb.png')
			assert.equal(data.thumbnail.url.length, fplen)
			assert.equal(data.scaled.path, '/images/te-2rb-scaled.png')
			assert.equal(data.scaled.url.length, fplen)
			assert.equal(data.scaledThumbnail.path, '/images/te-2rb-scaled-thumb.png')
			assert.equal(data.scaledThumbnail.url.length, fplen)
			done()
		})
		.catch(done)
	})


	it('sets up the correct tag for texture', function(done) {
		imp.handleUpload(images.small, 'foo')
		.then(function(data) {
			assert.deepEqual(data.tags, ['texture'])
			done()
		})
		.catch(done)
	})
})
