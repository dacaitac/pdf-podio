'use strict'

const PodioJS = require('podio-js').api
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config.json'))
const converter = require('./converter')
const nodemailer = require('nodemailer')

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
}, {
  apiURL: config.apiURL,
  enablePushService: true
})

function request (method, podioRequest, data, callback) {
  data = data || null
  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated()
      .then(() => { // Ready to make API calls in here...
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
    email: response.fields[1].values[0].value,
    idNumber: response.fields[2].values[0].value,
    addressed: response.fields[3].values[0].value
  }
}

function getItems (appId) {
  request('GET', `/item/app/${appId}/`, null, (response) => {
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
      .then((pdfs) => {
        let strEs = pdfs[0].filename.split('/')
        let strEn = pdfs[1].filename.split('/')

        let data = []

        data.push({
          filename: strEs[strEs.length - 1],
          filepath: pdfs[0].filename
        })

        data.push({
          filename: strEn[strEn.length - 1],
          filepath: pdfs[1].filename
        })
        sendMail(podioObject, data)
        return data
      })
      .then((data) => {
        // Sube el archivo y retorna el id
        console.log('Uploading File')
        let fileId1 = podio.uploadFile(data[0].filepath, data[0].filename)
        let fileId2 = podio.uploadFile(data[1].filepath, data[1].filename)
        return [fileId1, fileId2]
      })
      .then((podioFiles) => {
        let fileId1 = podioFiles[0].file_id
        let fileId2 = podioFiles[1].file_id

        request('POST', `/file/${fileId1}/attach`, {file_id: fileId1, ref_type: 'item', ref_id: itemId}, () => { console.log('File 1 attached') })
        request('POST', `/file/${fileId2}/attach`, {file_id: fileId2, ref_type: 'item', ref_id: itemId}, () => { console.log('File 2 attached') })
      })
      .catch(err => console.log(err))
  })
}

const onNotificationReceived = (message) => {
  console.log(message)
}

function getPushItem () {
  podio.authenticateWithApp(appId, appToken, (err) => {
    if (err) throw new Error(err)

    podio.isAuthenticated()
      .then(() => {
        console.log('Making Request')
        podio.request('GET', `/item/${itemId}`)
          .then((data) => {
            podio.push(data.push).subscribe(() => {
              console.log(data)
            })
              .then(() => {
                console.log(`All is well, we've been subscribed!`)
              })
          }).catch(err => { throw new Error(err) })
      }).catch(err => console.log(err))
  })
}

function getItem (itemId) {
  request('GET', `/item/${itemId}`, null, (response) => {
    console.log(response)
  })
}

function sendMail (podioObject, filesPath) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'daniel.caita@aiesec.net',
      pass: 'superbaguvixgt@'
    }
  })
  var mailOptions = {
    from: 'daniel.caita@aiesec.net',
    // to: podioObject.email,
    to: 'i7.danielcc@gmail.com',
    subject: 'Invitation letter for AMERICAS Congress',
    text: `Dear ${podioObject.name},
          Attached you will find the invitation letter.
          If you have any doubt don't hesitate to contact us.

          See un soon!`,
    attachments: [{path: filesPath[0].filepath}, {path: filesPath[1].filepath}]
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

// getPushItem()
itemAction(itemId)
// getItems(config.appId)
