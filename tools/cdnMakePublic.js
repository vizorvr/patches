const when = require('when')
const CloudStorage = require('../lib/cloudStorage')

const done = (err) => {
  console.log('Done - closing')

  if (err) {
    console.error('ERROR: ', err)
    throw err
  } else {
    console.log('Done.')
  }
}

function setPublic() {
  return file => {
    cloudStorage.retry(() => {
      return file.makePublic()
      .then(() => {
        console.log(' + ', file.name)
      })
    })
  }
}

const cloudStorage = new CloudStorage()
cloudStorage.bucket.getFilesStream()
.on('error', done)
.on('data', setPublic())
.on('end', () => {
  done()
})
