const fs = require('fs-extra')
const info = require('../info')
const ejs = require('ejs')
const reporter = require('../reporter')
const pathLib = require('path')

var templates = {}

function getTemplates (rootDirectory, request) {
  if (Object.keys(templates).length === 0) {
    for (var language in request.languages) {
      var content = fs.readFileSync(rootDirectory + pathLib.sep + 'templates' + pathLib.sep + request.languages[language] + '.ejs', 'utf8')
      templates[request.languages[language]] = content
    }
  }

  return templates
}

function writeExampleFiles (params, examplesPath, rootDirectory, request) {
  var templates = getTemplates(rootDirectory, request)
  reporter.log(request, 'Generating samples for endpoint: ' + params.uri + ', method: ' + params.request_method.toUpperCase())
  for (var language in request.languages) {
    var folderName = examplesPath + params.uri.replace(/\//g, '_')

    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }

    var folderMethodName = folderName + pathLib.sep + params.request_method.toUpperCase()

    if (!fs.existsSync(folderMethodName)) {
      fs.mkdirSync(folderMethodName)
    }

    params.rootDirectory = rootDirectory

    var fileName = folderMethodName + pathLib.sep + request.languages[language] + info.extension[request.languages[language]]
    fs.writeFileSync(fileName, ejs.render(templates[request.languages[language]], params))
    reporter.log(request, '\tGenerated sample: ' + fileName.replace(request.getGeneratedSamplesFolder(), ''))
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
