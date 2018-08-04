const PodioJS = require('podio-js').api
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config.json'))
const converter = require('./converter')

// Just for testing
const itemId = 902773349

// get the API id/secret
const clientId = config.clientId
const clientSecret = config.clientSecret

// get the app ID and Token for appAuthentication
const appId = config.appId
const appToken = config.appToken

// instantiate the SDK
const podio = new PodioJS({
  authType: 'server',
  clientId: clientId,
  clientSecret: clientSecret
})

function request (method, podioRequest, data, callback) {
  data = data || null
  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated()
      .then(() => { // Ready to make API calls in here...
        console.log('Making Request')
        podio.request(method, podioRequest, data)
          .then(response => {
            console.log('Request Complete')
            callback(response)
          })
          .catch(err => console.log(err))
      }).catch(err => console.log(err))
  })
}

function setPodioObject (response) { // Este ojeto se define para cada instancia del programa
  return {
    itemId: response.item_id,
    name: response.fields[0].values[0].value,
    idNumber: response.fields[3].values[0].value,
    addressed: response.fields[2].values[0].value
  }
}

function getItems (appId) {
  request('GET', `/item/app/${appId}/`, null,(response) => {
    let itemList = response.items
    itemList.map(function (item) {
      item = setPodioObject(item)
      itemAction(item.itemId)
    })
  })
}

function itemAction (itemId) {
  request('GET', `/item/${itemId}`, null, (response) => {
    let podioObject = setPodioObject(response)
    converter.convertPDF(config, podioObject)
      .then( (pdf) => {
        let str = pdf.filename.split('/')
        let data = {
          filename: str[str.length - 1],
          filepath: pdf.filename
        }
        return data
      })
      .then( (data) => {
        // Sube el archivo y retorna el id
        console.log('Uploading File');
        return podio.uploadFile(data.filepath, data.filename)
      })
      .then ((podioFile) => {
        let fileId = podioFile.file_id
        console.log(`File uploaded FileID: ${fileId}`);
        request('POST', `/file/${fileId}/attach`, {file_id: fileId, ref_type: 'item', ref_id: itemId},
          () => { console.log('File attached') })
      })
      .catch(err => console.log(err))
  })
}

// itemAction(itemId)
getItems(config.appId)
