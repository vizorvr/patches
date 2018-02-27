var GridFsStorage = require('../../lib/gridfs-storage');
var when = require('when');
var nodefn = require('when/node');
var assert = require('assert');
var fsPath = require('path');
var fs = require('fs-extra');
var EventEmitter = require('events').EventEmitter;
var mongoose = require('mongoose');
var mongo = require('mongodb');
var Grid = require('gridfs-stream');

var images = {
	small: __dirname+'/../../browser/images/engilogo.png',
	texture: __dirname+'/../../browser/images/no_texture.png'
};

describe('GridFsStorage', function()
{
	var gfs, db, grid;

	before(function(done)
	{
		mongoose.connect(`localhost:27017/test${process.pid}`);
		mongoose.connection.on('error', err => { throw err })
		mongoose.connection.on('connected', () => {
			db = mongoose.connection.db;
			grid = Grid(db, mongo);
			gfs = new GridFsStorage('/foo', grid);
			gfs.on('ready', function() {
				gfs.copy(images.small, '/images/engilogo.png')
				.then(function() {
					done();
				});
			});
		});
	});

	after(function()
	{
		db.dropDatabase();
	})

	it('can copy file from filesystem', function(done)
	{
		gfs.copy(images.texture, '/images/no_texture.png')
		.then(function()
		{
			return gfs.stat('/images/no_texture.png')
			.then(function(stat)
			{
				assert.equal(stat.length, 18215);
				done();
			});
		})
		.catch(done);
	});

	it('can find files by path', function(done)
	{
		gfs.stat('/images/engilogo.png')
		.then(function(file)
		{
			assert.equal(file.length, 31482);
			done();
		})
		.catch(done);
	});

	it('can read files', function()
	{
		var stream = gfs.read('/images/engilogo.png');
		assert.equal(stream.name, '/images/engilogo.png');
	});

	it('returns the right urls', function(done)
	{
		gfs.copy(images.texture, '/images/no_texture.png')
		.then(function(url)
		{
			assert.equal('/foo/images/no_texture.png', url);
			done();
		})
		.catch(done);
	});

	it('can read partial file from filesystem', function(done) {
		var stream = gfs.createReadStream('/images/engilogo.png', {startPos: 1000, endPos: 2000});
		assert.equal(stream.name, '/images/engilogo.png');
		assert.equal(stream.range.startPos, 1000);
		assert.equal(stream.range.endPos, 2000);

		var buffers = [];
		stream.on("data", function (chunk) {
			buffers.push(chunk);
		})
		stream.on("end", function () {
			var buffer = Buffer.concat(buffers);
			var bufferLength = buffer.length;
			assert.equal(bufferLength, 1001);
			done();
		})
		stream.on("error", function (err) {
			throw err;
		})

	});

});
