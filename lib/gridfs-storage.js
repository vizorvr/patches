var config = require('../config/config').server.mongo;
var when = require('when');
var nodefn = require('when/node');
var fs = require('fs');
var mongo = require('mongodb');
var Grid = require('gridfs-stream');
var EventEmitter = require('events').EventEmitter;
var mime = require('mime');
var Readable = require('stream').Readable

var DB_NAME = 'engi-assets';

function GridFsStorage(gridWebRoot, gfs) {
	EventEmitter.apply(this);

	this._webroot = gridWebRoot;

	if (!gfs)
	{
		this._connect();
	}
	else 
	{
		this._gfs = gfs;
		process.nextTick(this.emit.bind(this, 'ready'));
	}
}
GridFsStorage.prototype = Object.create(EventEmitter.prototype);

GridFsStorage.prototype.url = function(url)
{
	if (url.indexOf(this._webroot) !== 0)
		return this._webroot + url;
	return url;
}

GridFsStorage.prototype._connect = function()
{
	var that = this;

	var db = new mongo.Db(
		DB_NAME,
		new mongo.Server(config.host, config.port),
		{ safe: true }
	);

	db.open(function(err)
	{
		if (err) throw err;

		db.collection('fs.files', function(err, coll) {
			if (err) throw err;
			coll.ensureIndex({ filename: -1 }, { unique: true }, function() {});
		});

		that._gfs = Grid(db, mongo);
		that.emit('ready');
	});
}

GridFsStorage.prototype.exists = function(path)
{
	return nodefn.call(this._gfs.exist.bind(this._gfs), { filename: path });
}

GridFsStorage.prototype.createReadStream = function(path)
{
	return this.read(path);
}

GridFsStorage.prototype.createWriteStream = function(path, mimetype)
{
	var that = this;

	return this.stat(path)
	.then(function(stat)
	{
		var opts = { filename: path, mode: 'w' };
		if (mimetype)
			opts.content_type = mimetype;
		else
			opts.content_type = mime.lookup(path);

		if (stat)
			opts._id = stat._id;

		return that._gfs.createWriteStream(opts);
	});
}

GridFsStorage.prototype.writeString = function(path, stringData)
{
	return this.createWriteStream(path)
	.then(function(writeStream)
	{
		var dfd = when.defer();
		writeStream.on('close', function()
		{
			dfd.resolve();
		})
		.on('error', function(err)
		{
			dfd.reject(err);
		})

		var s = new Readable();
		s._read = function() {};
		s.push(new Buffer(stringData));
		s.pipe(writeStream);
		writeStream.on('drain', function()
		{
			s.emit('end');
		});

		return dfd.promise;
	});
}

GridFsStorage.prototype.readString = function(path)
{
	var stream = this._gfs.createReadStream(path)

	var dfd = when.defer();
	var buf = '';
	stream.on('data', function(d) {
		buf += d.toString();
	});
	stream.on('end', function() {
		dfd.resolve(buf);
	});
	return dfd.promise;
}

GridFsStorage.prototype.read = function(path)
{
	return this._gfs.createReadStream(path);
}

GridFsStorage.prototype.stat = function(path)
{
	var dfd = when.defer();
	this._gfs.files.find({ filename: path })
	.limit(1)
	.toArray(function(err, files)
	{
		if (err)
			return dfd.reject(error);

		dfd.resolve(files[0]);
	});

	return dfd.promise;
}

GridFsStorage.prototype.move = function(src, dest, metadata)
{
	return this.copy(src, dest, metadata)
	.then(function(url)
	{
		fs.unlink(src);
		return url;
	});
}

GridFsStorage.prototype.copy = function(src, dest, metadata)
{
	var that = this;

	return this.stat(dest)
	.then(function(existing)
	{
		var dfd = when.defer();

		var destination = {
			filename: dest,
			mode: 'w',
			content_type: mime.lookup(src),
			chunkSize: 1024, 
			metadata: metadata
		};

		if (existing)
			destination._id = existing._id;

		var stream = that._gfs.createWriteStream(destination)
		.on('error', function(err) { dfd.reject(err); })
		.on('close', function()
		{
			dfd.resolve(that.url(dest));
		});

		fs.createReadStream(src)
		.on('error', function(err) {
			dfd.reject(err);
		})
		.pipe(stream);

		return dfd.promise;
	});
}

module.exports = GridFsStorage;
