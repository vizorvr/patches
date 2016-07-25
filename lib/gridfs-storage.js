var when = require('when')
var nodefn = require('when/node')
var fs = require('fs')
var mongo = require('mongodb')
var Grid = require('gridfs-stream')
var EventEmitter = require('events').EventEmitter
var mime = require('mime')
var Readable = require('stream').Readable
var secrets = require('../config/secrets')

function GridFsStorage(gridWebRoot, gfs) {
	EventEmitter.apply(this)

	this._webroot = gridWebRoot

	if (!gfs) {
		this._connect()
	} else {
		this._gfs = gfs
		process.nextTick(this.emit.bind(this, 'ready'))
	}
}

GridFsStorage.prototype = Object.create(EventEmitter.prototype)

GridFsStorage.prototype.url = function(url) {
	if (url.indexOf(this._webroot) !== 0)
		return this._webroot + url
	return url
}

GridFsStorage.prototype._connect = function() {
	var that = this
	var gfsUrl = secrets.gridFs.split('/').slice(2)
	var gfsHostPort = gfsUrl[0].split(':')

	var db = this.db = new mongo.Db(
		gfsUrl[1],
		new mongo.Server(gfsHostPort[0], gfsHostPort[1]),
		{ safe: true }
	)

	db.open(function(err) {
		if (err) throw err

		db.collection('fs.files', function(err, coll) {
			if (err) throw err
			coll.ensureIndex({ filename: -1 }, { unique: true }, function() {})
		})

		that._gfs = Grid(db, mongo)
		that.emit('ready')
	})
}

GridFsStorage.prototype.close = function() {
	this.db.close()
}

GridFsStorage.prototype.exists = function(path) {
	return nodefn.call(this._gfs.exist.bind(this._gfs), { filename: path })
}

GridFsStorage.prototype.createReadStream = function(path, range) {
	return this.read(path, range)
}

GridFsStorage.prototype.createWriteStream = function(path, mimetype) {
	var that = this

	return this.stat(path)
	.then(function(stat) {
		var opts = { filename: path, mode: 'w' }

		try {
			if (mimetype)
				opts.content_type = mimetype
			else
				opts.content_type = mime.lookup(path)
		} catch (e) {
			return when.reject(e)
		}

		if (stat)
			opts._id = stat._id

		return that._gfs.createWriteStream(opts)
	})
}

GridFsStorage.prototype.writeString = function(path, stringData, encoding) {
	return this.createWriteStream(path)
	.then(function(writeStream) {
		var dfd = when.defer()
		writeStream.on('close', function() {
			dfd.resolve()
		})
		.on('error', function(err) {
			dfd.reject(err)
		})

		var s = new Readable()
		s._read = function() {}
		s.push(new Buffer(stringData, encoding))
		s.pipe(writeStream)
		writeStream.on('drain', function() {
			s.emit('end')
		})

		return dfd.promise
	})
}

GridFsStorage.prototype.readString = function(path) {
	var stream = this._gfs.createReadStream(path)

	var dfd = when.defer()
	var buf = ''

	stream.on('data', function(d) {
		buf += d.toString()
	})

	stream.on('error', function(err) {
		dfd.reject(err)
	})

	stream.on('end', function() {
		dfd.resolve(buf)
	})

	return dfd.promise
}

GridFsStorage.prototype.read = function(path, range) {
	var options = {}
	options.filename = path
	options.range = range
	return this._gfs.createReadStream(options)
}

GridFsStorage.prototype.unlink = function(path) {
	var dfd = when.defer()
	this._gfs.remove({ filename: path }, function(err) {
		if (err)
			return dfd.reject(err)
		dfd.resolve()
	})
	return dfd.promise
}

GridFsStorage.prototype.stat = function(path) {
	var dfd = when.defer()
	this._gfs.files.find({ filename: path })
	.limit(1)
	.toArray(function(err, files) {
		if (err)
			return dfd.reject(error)

		dfd.resolve(files[0])
	})

	return dfd.promise
}

GridFsStorage.prototype.move = function(src, dest, metadata) {
	return this.copy(src, dest, metadata)
	.then(function(url) {
		fs.unlink(src)
		return url
	})
}

GridFsStorage.prototype.copy = function(src, dest, metadata) {
	var that = this

	return this.stat(dest)
	.then(function(existing) {
		var dfd = when.defer()

		var destination = {
			filename: dest,
			mode: 'w',
			content_type: mime.lookup(src),
			chunkSize: 1024, 
			metadata: metadata
		}

		if (existing)
			destination._id = existing._id

		var stream = that._gfs.createWriteStream(destination)
		.on('error', function(err) { dfd.reject(err) })
		.on('close', function() {
			dfd.resolve(that.url(dest))
		})

		fs.createReadStream(src)
		.on('error', function(err) {
			dfd.reject(err)
		})
		.pipe(stream)

		return dfd.promise
	})
}

module.exports = GridFsStorage
