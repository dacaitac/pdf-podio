const fs = require('fs')
const pdf = require('dynamic-html-pdf')

exports.convertPDF = async function convertPDF (config, tags) {
  let html = fs.readFileSync(config.templateSpanish, 'utf8')

  var options = {
    format: 'A3',
    orientation: 'portrait',
    border: '10mm'
  }

  var document = {
    template: html,
    context: {
      options: tags,
      img1: 'https://image.ibb.co/hxpDiz/image1.png',
      img2: 'https://image.ibb.co/cmsoGK/image2.png',
      img3: 'https://image.ibb.co/j13vwK/image3.png'
    },
    path: `./Carta de invitacion para ${tags.name}.pdf`
  }

  let files = []

  console.log('Creating Spanish PDF...')
  files.push(await pdf.create(document, options)
    .then(res => {
      console.log('PDF Created')
      return res
    })
    .catch(error => {
      console.error(error)
    })
  )
  console.log('Creating English PDF...')

  html = fs.readFileSync(config.templateEnglish, 'utf8')
  document.path = `./Invitation letter for ${tags.name}.pdf`

  files.push(await pdf.create(document, options)
    .then(res => {
      console.log('PDF Created')
      return res
    })
    .catch(error => {
      console.error(error)
    })
  )
  return (files)
}
