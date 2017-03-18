const fs = require('fs')
const when = require('when')
const Storage = require('@google-cloud/storage')
const secrets = require('../config/secrets')
const EventEmitter = require('events').EventEmitter
const nodefn = require('when/node')
const Readable = require('stream').Readable
const mime = require('mime')
const retry = require('retry')

const URL_HEAD = '/data'
const projectId = 'vizor-162112'
const bucketName = 'cdn.vizor.io'

const stripPath = (path) => { return path.substring(1) }

class CloudStorage extends EventEmitter {
  constructor(gcs) {
    super()

    if (!gcs) {
      this.connect()
    } else {
      this.gcs = gcs
      process.nextTick(() => this.emit('ready'))
    }
  }

  connect() {
    let opts = {
      projectId: projectId,
    }

    if (process.env.NODE_ENV !== 'production') {
      opts.keyFilename = __dirname+'/../config/vizor-gcs.json'
    }

    this.gcs = new Storage(opts)

    this.bucket = this.gcs.bucket(bucketName)
    process.nextTick(() => this.emit('ready'))
  }

  close() {}

  file(path) {
    return this.bucket.file(stripPath(path))
  }

  exists(path) {
    return this.file(path).exists()
    .then(data => { return data[0] })
  }

  stat(path) {
    return this.file(path).get()
    .catch(() => { return undefined })
    .then(data => { return data ? data[0] : undefined })
  }

  url(path) {
    if (path.indexOf(URL_HEAD) === 0)
      return path

    return URL_HEAD + '/' + stripPath(path)
  }

  copy(src, path, metadata) {
    return this.exists(path)
    .then(exists => {
      if (exists) {
        console.log('  - GCS: Already exists: ', path)
        return this.url(path)
      }

      return this.retry(() => {
        return this.writeStream(fs.createReadStream(src), path, metadata)
      })
    })
  }

  retry(fn) {
    const dfd = when.defer()
    const op = retry.operation({
      retries: 10,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 60 * 1000,
      randomize: true
    })

    op.attempt(currentAttempt => {
      fn()
      .then(result => dfd.resolve(result))
      .catch(err => {
        if (op.retry(err))
          return console.log('    !! RETRYING', currentAttempt, err.code)

        return dfd.reject(op.mainError())
      })
    })

    return dfd.promise
  }

  writeStream(stream, path, metadata={}) {
    const dfd = when.defer()

    stream.pipe(this._createWriteStream(path, metadata.contentType))
    .on('error', err => {
      console.error('Failed to write file', err)
      dfd.reject(err)
    })
    .on('finish', () => {
      console.log('  -> Google Cloud Storage: ', path)
      dfd.resolve(this.url(path))
    })

    return dfd.promise
  }

  move(src, path, metadata) {
    return this.retry(() => {
      return this.copy(src, path, metadata)
    	.then(function(url) {
    		fs.unlink(src)
    		return url
    	})
    })
  }

  unlink(path) {
    return this.file(path).delete()
  }

  read(path) {
    return this.file(path).createReadStream()
  }

  readString(path) {
    const stream = this.read(path)
    const dfd = when.defer()
    let buf = ''

    stream.on('data', d => buf += d.toString())
    stream.on('error', err => dfd.reject(err))
    stream.on('end', () => dfd.resolve(buf))

    return dfd.promise
  }

  writeString(path, stringData, encoding) {
    const writeStream = this._createWriteStream(path)
    var dfd = when.defer()

    writeStream.on('finish', () => {
      console.log('  -> Google Cloud Storage: ', path)
      dfd.resolve()
    })
    .on('error', err => dfd.reject(err))

    var s = new Readable()
    s._read = function() {}
    s.push(new Buffer(stringData, encoding))
    s.pipe(writeStream)
    writeStream.on('drain', function() {
      s.emit('end')
    })

    return dfd.promise
  }

  _createWriteStream(path, mimetype) {
    return this.file(path).createWriteStream({
      public: true,
      metadata: {
        contentType: mimetype || mime.lookup(path),
        cacheControl: 'public',
        contentDisposition: 'inline'
      }
    })
  }

  createWriteStream(path, mimetype) {
    return when.resolve(this._createWriteStream(path, mimetype))
  }
}

module.exports = CloudStorage
