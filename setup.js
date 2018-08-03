const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config.json'))
const Podio = require('podio-js')

// get the API id/secret
const clientId = config.clientId
const clientSecret = config.clientSecret

// get the app ID and Token for appAuthentication
const appId = config.appId
const appToken = config.appToken

// instantiate the SDK
const PodioJS = Podio.api
const podio = new PodioJS({
  authType: 'app',
  clientId: clientId,
  clientSecret: clientSecret
})

exports.request = function request (method, podioRequest, data, callback) {
  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated()
    .then(() => { // Ready to make API calls in here...
      console.log('Making Request');
      podio.request(method, podioRequest, data)
      .then(response => {
        console.log('Request Complete')
        return response
      })
      .then(response => {
        console.log('Executing...')
        callback(response)
      })
      .catch(err => console.log(err))      
    }).catch(err => console.log(err))
  })
}

exports.uploadFile = function uploadFile (file) {
  let str = file.filename.split('/')
  let filename = str[str.length -1]

  data = {
    source: file.filename,
    filename: filename
  }

  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated()
    .then(() => { // Ready to make API calls in here...
      console.log('Making Request - File')
      podio.request('POST', '/file/', data)
      .then(response => {
        console.log('Uploading file');
        console.log(response)
      })
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  })
}
