const pathLib = require('path')

var acceptedLanguages = ['python', 'unirest.node', 'curl', '2xx-response', 'slate']
var acceptedValidationLanguages = ['unirest.node', 'python', 'curl']

var extension = {
  python: '.py',
  'unirest.node': '.js',
  curl: '',
  '2xx-response': '.json',
  slate: '.md'
}
var fileNameEnding = {
  python: '.py',
  'unirest.node': '.js',
  curl: 'curl',
  '2xx-response': '.json'
}

var httpMethods = ['POST', 'GET', 'PUT', 'DELETE']

var languages = []
var validationLanguages = []

var conf
var env = {}

var authentication = 'None'

var logFileStream

var templatesFolder = process.cwd() + pathLib.sep + 'templates'

function setLanguages (fields) {
  this.languages = ['slate']

  for (var language in this.acceptedLanguages) {
    if (fields[this.acceptedLanguages[language]] === 'on') {
      this.languages.push(this.acceptedLanguages[language])
    }
  }

  if (this.languages.length === 1) {
    this.languages = this.acceptedLanguages
  }

  this.validationLanguages = this.languages.filter(lang => this.acceptedValidationLanguages.indexOf(lang) !== -1)
}

module.exports = {
  setLanguages,
  extension,
  acceptedLanguages,
  acceptedValidationLanguages,
  fileNameEnding,
  httpMethods,
  languages,
  validationLanguages,
  conf,
  env,
  authentication,
  logFileStream,
  templatesFolder
}
