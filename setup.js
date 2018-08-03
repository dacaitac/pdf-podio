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

exports.request = function request (method, podioRequest, callback) {
  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated().then(() => { // Ready to make API calls in here...
      podio.request(method, podioRequest)
        .then(response => {
          callback(response)
        })
    }).catch(err => console.log(err))
  })
}
