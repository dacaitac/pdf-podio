const podio = require('./setup')
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('./config.json'))
const converter = require('./converter')

const itemId = 902773349 // Just for testing

function setPodioObject (response) { // Este ojeto se define para cada instancia del programa
  return {
    itemId: response.item_id,
    name: response.fields[0].values[0].value,
    idNumber: response.fields[3].values[0].value,
    addressed: response.fields[2].values[0].value
  }
}

function getItems (appId) {
  podio.request('GET', `/item/app/${appId}/`, (response) => {
    let itemList = response.items
    itemList.map(function (item) {
      item = setPodioObject(item)
      itemAction(item.itemId)
    })
  })
}

function itemAction (itemId) {
  podio.request('GET', `/item/${itemId}/`, null, (item) => {
    let podioObject = setPodioObject(item)
    converter.convertPDF(config, podioObject)
      .then((pdf) => {
        podio.uploadFile(pdf)
      })
      .catch(err => console.log(err))
  })
}

itemAction(itemId)
// getItems(config.appId)
