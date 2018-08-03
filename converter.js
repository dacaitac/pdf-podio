const fs = require('fs')
const pdf = require('dynamic-html-pdf')

exports.convertPDF = function convertPDF (config, tags) {
  const html = fs.readFileSync(config.template, 'utf8')

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
      img3: 'https://image.ibb.co/j13vwK/image3.png',
    },
    path: `./Carta de invitacion para ${tags.name}.pdf`
  }

  console.log('Creating PDF...');
  return pdf.create(document, options)
    .then(res => {
      console.log('PDF Created')
      return res
    })
    .catch(error => {
      console.error(error)
    })
}
