const fs = require('fs-extra')
const info = require('../info')
const ejs = require('ejs')
const reporter = require('../reporter')
const pathLib = require('path')
const constants = require('../constants')

var templates = {}

function getTemplates (rootDirectory) {
  if (Object.keys(templates).length === 0) {
    for (var language in info.languages) {
      var content = fs.readFileSync(rootDirectory + pathLib.sep + 'templates' + pathLib.sep + info.languages[language] + '.ejs', 'utf8')
      templates[info.languages[language]] = content
    }
  }

  return templates
}

function writeExampleFiles (params, examplesPath, rootDirectory) {
  var templates = getTemplates(rootDirectory)
  reporter.log('Generating samples for endpoint: ' + params.uri + ', method: ' + params.request_method.toUpperCase())
  for (var language in info.languages) {
    var folderName = examplesPath + params.uri.replace(/\//g, '_')

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    var folderMethodName = folderName + '/' + params.request_method.toUpperCase()

    if (!fs.existsSync(folderMethodName)) {
      fs.mkdirSync(folderMethodName)
    }

    params.rootDirectory = rootDirectory

    var fileName = folderMethodName + '/' + info.languages[language] + info.extension[info.languages[language]]
    fs.writeFileSync(fileName, ejs.render(templates[info.languages[language]], params))
    reporter.log('\tGenerated sample: ' + fileName.replace(constants.GENERATED_EXAMPLES_FOLDER, ''))
  }
}

function writeDebug (debug, params, examplesPath) {
  var debugString = JSON.stringify(debug, null, 4)

  var folderName = examplesPath + params.uri.replace(/\//g, '_')

  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName)
  }

  var folderMethodName = folderName + '/' + params.request_method.toUpperCase()

  if (!fs.existsSync(folderMethodName)) {
    fs.mkdirSync(folderMethodName)
  }

  var fileName = folderMethodName + '/debug.json'

  fs.writeFileSync(fileName, debugString)
}

module.exports = {
  writeDebug,
  writeExampleFiles
}
