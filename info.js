var acceptedLanguages = ['python', 'unirest.node', 'java', '2xx-response', 'slate', 'curl']

var acceptedValidationLanguages = ['unirest.node', 'python', 'java', 'curl']

var extension = {
  python: '.py',
  'unirest.node': '.js',
  java: '.java',
  curl: '',
  '2xx-response': '.json',
  slate: '.md'
}
var fileNameEnding = {
  python: '.py',
  'unirest.node': '.js',
  java: '.java',
  curl: 'curl',
  '2xx-response': '.json'
}

var httpMethods = ['POST', 'GET', 'PUT', 'DELETE']

var onWindows = process.platform === 'win32'

var requestReady = {}
var generationLogPosition = {}
var validationLogPosition = {}

// To know the stage of the process of generation and validation
var stage = {}
var stageReady = {}

// To know if is the server or the command line tool
var commandLine = false

module.exports = {
  extension,
  acceptedLanguages,
  acceptedValidationLanguages,
  fileNameEnding,
  httpMethods,
  onWindows,
  requestReady,
  validationLogPosition,
  generationLogPosition,
  stage,
  stageReady,
  commandLine
}
