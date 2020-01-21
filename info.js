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

var started = {}

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
  started
}
