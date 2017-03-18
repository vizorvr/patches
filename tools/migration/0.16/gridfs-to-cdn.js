const when = require('when')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const GridFsStorage = require('../../../lib/gridfs-storage')
const secrets = require('../../../config/secrets')
const Graph = require('../../../models/graph')
const _ = require('lodash')
const E2 = require('../../../browser/scripts/core').E2
const loadingPlugins = Object.keys(E2.LOADING_NODES)
const CloudStorage = require('../../../lib/cloudStorage')
const guard = require('when/guard')

let gfs, filesColl, cloudStorage

const done = (err) => {
  console.log('Done - closing')

  gfs.close()
  mongoose.disconnect()

  if (err) {
    console.error('ERROR: ', err)
    throw err
  } else {
    console.log('Done.')
  }
}

// connect to GridFS and Google Cloud Storage
const connect = () => {
  var dfd = when.defer()
  mongoose.connect(secrets.db)
  mongoose.connection.on('connected', () => {
    gfs = new GridFsStorage('/data')
  	gfs.on('ready', () => {
      gfs.db.collection('fs.files', (err, coll) => {
        if (err) throw err
        filesColl = coll
      })

      cloudStorage = new CloudStorage()
      cloudStorage.on('ready', () => dfd.resolve())
  	})
  })

  return dfd.promise
}

// find assets contained in a graph
const findAssets = (subgraph, assets) => {
	if (!subgraph.nodes)
		return

  assets = assets || []

	subgraph.nodes.map(function(node) {
		if (E2.GRAPH_NODES.indexOf(node.plugin) > -1)
			return findAssets(node.graph, assets)

		if (loadingPlugins.indexOf(node.plugin) === -1)
			return;

		assets.push(node.state.url)
	})

	assets = _.uniq(assets)
  return assets
}

// go through all assets and move them to CDN
connect()
.then(() => {
  const dfd = when.defer()

  filesColl.find().toArray((err, files) => {
    if (err)
      return dfd.reject(err)

    when.map(files, guard(guard.n(50), asset => {
      let assetPath = asset.filename

      if (assetPath.indexOf('/data') === 0)
        return when.resolve()

      return cloudStorage.exists(assetPath).then(exists => {
        if (exists) {
          // console.log('  - Already exists', assetPath)
          return
        }

        return gfs.stat(assetPath).then(stat => {
          return cloudStorage.retry(() => {
            return cloudStorage.writeStream(gfs.read(assetPath), assetPath, stat)
          })
        })
      })
    }))
    .then(() => {
      done()
    })
    .catch(err => { return dfd.reject(err) })
  })

  return dfd.promise
})
.catch(done)
