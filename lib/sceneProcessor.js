const fs = require('fs')
const fsPath = require('path')
const when = require('when')
const yauzl = require('yauzl')
const slugify = require('../models/asset-helper').slugify
const replaceStream = require('replacestream')
const gm = require('gm')
const temp = require('temp').track()
const ImageProcessor = require('./imageProcessor')

const mainFileExtensions = [
	'.obj', '.js', '.json', '.gltf', '.fbx', '.dae'
]
const textureExtensions = [
	'.jpg', '.jpeg', '.png', '.tga', '.dds', '.gif',
]
const needsConversionExtensions = [
	'.tga', '.gif',
]
const allowedExtensions = ['.mtl','.bin', '.glsl', '.txt']
	.concat(textureExtensions)
	.concat(mainFileExtensions)

function SceneProcessor(storage) {
	if (!storage)
		throw new Error('SceneProcessor got no storage')

	this._fs = storage
	this.imageProcessor = new ImageProcessor(this._fs)
}

/** 
 * pre-process a file upload to build metadata and 
 * determine whether we'll accept it 
 */
SceneProcessor.prototype.preprocess = function(file, sceneFolder) {
	var dfd = when.defer()
	var extname = fsPath.extname(file.path).toLowerCase()
	var manifest = {
		fsPath: file.path,
		slug: slugify(fsPath.basename(file.path, fsPath.extname(file.path))),
		isArchive: extname === '.zip',
		valid: false,
		files: {},
		changedNames: {},
		textures: []
	}

	manifest.path = sceneFolder

	if (!manifest.isArchive) {
		manifest.type = extname.substring(1)
		manifest.dest = manifest.path = sceneFolder + '/' + manifest.slug + extname
		manifest.valid = (mainFileExtensions.indexOf(extname) !== -1)
		return when.resolve(manifest)
	}

	yauzl.open(file.path, function(err, zip) {
		if (err)
			return dfd.reject(err)
		
		zip.on('entry', function(entry) {
			var entryExt = fsPath.extname(entry.fileName)
			var entryBn = fsPath.basename(entry.fileName)

			if (allowedExtensions.indexOf(entryExt) === -1 ||
				entryBn[0] === '.' ||
				entryBn[0] === '_')
			{
				return;
			}

			var mf = {
				path: entry.fileName,
				basename: entryBn,
				slug: fsPath.basename(entryBn, entryExt),
				extname: entryExt,
			}

			if (mainFileExtensions.indexOf(entryExt) > -1) {
				// object
				if (!manifest.type)
					manifest.type = mf.extname.substring(1)

				manifest.valid = true
				mf.isMainFile = true
				mf.slug = manifest.slug
			} else {
				// asset
				mf.isTexture = textureExtensions.indexOf(entryExt) > -1
				mf.needsConversion = needsConversionExtensions.indexOf(entryExt) > -1

				if (mf.isTexture && mf.needsConversion) 
					mf.extname = '.png'

				if (mf.extname === '.mtl') {
					mf.isMaterial = true
					manifest.type = 'objmtl'
					mf.slug = manifest.slug
				}
			}

			mf.dest = sceneFolder + '/' + mf.slug + mf.extname
			mf.destBasename = fsPath.basename(mf.dest)

			if (mf.basename !== mf.destBasename)
				manifest.changedNames[mf.basename] = mf.destBasename

			if (mf.isTexture)
				manifest.textures.push(mf.dest)

			manifest.files[mf.basename] = mf
		})
		.on('error', function(err) {
			console.error(err)
			dfd.resolve(manifest)
		})
		.on('close', function() {
			dfd.resolve(manifest)
		})
	})

	return dfd.promise
}

SceneProcessor.prototype.handleUpload = function(file, sceneRoot) {
	var that = this
	var extless = fsPath.basename(file.name, fsPath.extname(file.name))
	var sceneSlug = sceneRoot + '/' + slugify(extless)

	console.info('SceneProcessor.handleUpload', file.path, sceneSlug)

	return this.preprocess(file, sceneSlug)
	.then(function(manifest) {
		console.info(' - manifest', manifest)

		if (!manifest.valid)
			return new Error('We support the following file formats: ' + mainFileExtensions.join(', '))

		if (manifest.isArchive)
			return that.processZipUpload(manifest, file)

		var readStream = fs.createReadStream(file.path)

		return that.writeStreamToGridFs(readStream, manifest.dest)
		.then(function(gf) {
			return {
				path: manifest.dest,
				url: gf.url,
				type: manifest.type,
				files: [ gf.url ]
			}
		})
	})
}

SceneProcessor.prototype.writeStreamToGridFs = function(readStream, destPath) {
	var that = this
	var dfd = when.defer()

	this._fs.createWriteStream(destPath)
	.then(function(writeStream) {
		readStream.pipe(writeStream)
		.on('error', function(err) {
			dfd.reject(err)
		})
		.on('close', function() {
			dfd.resolve({
				path: destPath,
				url: that._fs.url(destPath)
			})
		})
	})

	return dfd.promise
}

SceneProcessor.prototype.processZipUpload = function(zipManif, file) {
	var dfd = when.defer()
	var that = this
	var files = []
	var textures = []
	var processing = 0
	var closed = false
	var mainFileUrl

	var changedNames = Object.keys(zipManif.changedNames)

	console.info(' Processing zip upload', zipManif)

	yauzl.open(file.path, function(err, zip) {
		if (err)
			return dfd.reject(err)

		function handleError(err) {
			zip.close()
			dfd.reject(err)			
		}
		
		zip.on('entry', function(entry) {
			var entryManif = zipManif.files[fsPath.basename(entry.fileName)]
			if (!entryManif)
				return;

			function writeEntry(fromStream) {
				return that.writeStreamToGridFs(fromStream, entryManif.dest)
				.then(function(wroteFile) {
					files.push(wroteFile.url)

					if (entryManif.isTexture)
						textures.push(wroteFile.url)

					if (entryManif.isMainFile)
						mainFileUrl = wroteFile.url

					processing--

					if (closed && !processing) {
						var zipAsset = {
							path: zipManif.path,
							url: mainFileUrl,
							type: zipManif.type,
							textures: textures,
							files: files
						}

						console.info(' - zip asset', zipAsset)

						dfd.resolve(zipAsset)
					}
				})
				.catch(handleError)
			}

			zip.openReadStream(entry, function(err, readStream) {
				if (err)
					return handleError(err)

				processing++

				// change names in material file
				if (changedNames.length && entryManif.isMaterial) {
					var filterStream = readStream
					changedNames.map(function(fromName) {
						filterStream = filterStream.pipe(
							replaceStream(fromName, zipManif.changedNames[fromName]))
					})
					return writeEntry(filterStream)
				}

				if (!entryManif.needsConversion)
					return writeEntry(readStream)

				if (entryManif.isTexture) {
					return that.convertTexture(entryManif.basename, readStream)
					.then(function(convertedPath) {
						return writeEntry(fs.createReadStream(convertedPath))
					})
				}
			})
		})
		.on('error', handleError)
		.on('close', function() {
			closed = true
		})
		.on('end', function() {
		})
	})

	return dfd.promise
}

SceneProcessor.prototype.convertTexture = function(basename, readStream) {
	var that = this
	var dfd = when.defer()

	// write the readStream into a file
	var tempPath = temp.path({ suffix: fsPath.extname(basename) })
	var writeStream = fs.createWriteStream(tempPath)

	readStream.pipe(writeStream)
	.on('error', function(err) {
		fs.unlink(tempPath)
		dfd.reject(err)
	})
	.on('close', function() {
		that.imageProcessor.normalizeImage(tempPath)
		.then(function(convertedPath) {
			fs.unlink(tempPath)
			dfd.resolve(convertedPath)
		})
		.catch(function(err) {
			dfd.reject(err)
		})
	})

	return dfd.promise
}

module.exports = SceneProcessor
