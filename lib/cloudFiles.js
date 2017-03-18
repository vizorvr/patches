const fs = require('fs')
const when = require('when')
const pkgcloud = require('pkgcloud')
const secrets = require('../config/secrets')
const EventEmitter = require('events').EventEmitter
const nodefn = require('when/node')
const mime = require('mime')

const CONTAINER = 'vizor-assets'
const REGION = 'dfw'
const URL_HEAD = '/data'

class CloudFiles extends EventEmitter {
  constructor(rackspace) {
    super()

    if (!rackspace) {
      this.connect()
    } else {
      this.rackspace = rackspace
      process.nextTick(() => this.emit('ready'))
    }
  }

  connect() {
    this.rackspace = pkgcloud.storage.createClient({
      provider: 'rackspace',
      username: secrets.cloudFilesUser,
      apiKey: secrets.cloudFilesApiKey,
      region: REGION
    })

    process.nextTick(() => this.emit('ready'))
  }

  exists(path) {
    console.log('CF exists', path)
    return this.stat(path)
    .then(file => { return !!file })
  }

  stat(path) {
    console.log('CF stat', path)
    return nodefn.apply(this.rackspace.getFile, CONTAINER, path)
    .catch(() => { return false })
    .then(file => { return file })
  }

  url(path) {
    if (path.indexOf(URL_HEAD) === 0)
      return path

    return URL_HEAD + path
  }

  copy(src, path, metadata) {
    console.log('CF copy', src, path, metadata)
    return this.writeStream(fs.createReadStream(src), path, metadata)
  }

  writeStream(source, path, metadata) {
    const dfd = when.defer()
    const dest = this.rackspace.upload({
      container: CONTAINER,
      remote: path,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      metadata: metadata
    })

    dest.on('error', err => dfd.reject(err))
    dest.on('success', () => {
      console.log('  - CloudFile:', path)
      this.rackspace.getContainer(CONTAINER, (err, file) => {
        console.log('file', file)
      })
      dfd.resolve(this.url(path))
    })

    source
    .on('error', err => dfd.reject(err))
    .pipe(dest)

    return dfd.promise
  }

  move(src, dest, metadata) {
    console.log('CF move', src, path, metadata)
    return this.copy(src, dest, metadata)
  	.then(function(url) {
  		fs.unlink(src)
  		return url
  	})
  }

  unlink(path) {
    console.log('CF unlink', path)
    return nodefn.apply(this.rackspace.removeFile, CONTAINER, path)
  }

  read(path) {
    console.log('CF read', path)
    return this.rackspace.download({
      container: CONTAINER,
      remote: path
    }, function(err) {
      if (err)
        console.error(err)
    })
  }

  createWriteStream(path, mimetype) {
    return when.resolve(this.rackspace.upload({
      container: CONTAINER,
      remote: path,
      contentType: mimetype || mime.lookup(path),
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }))
  }

}

module.exports = CloudFiles
