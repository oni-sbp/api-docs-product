var acceptedLanguages = ['python', 'unirest.node', 'curl', '2xx-response', 'slate', 'java']

var acceptedValidationLanguages = ['unirest.node', 'python', 'curl']

var extension = {
  python: '.py',
  'unirest.node': '.js',
  curl: '',
  '2xx-response': '.json',
  slate: '.md',
  java: '.java'
}
var fileNameEnding = {
  python: '.py',
  'unirest.node': '.js',
  curl: 'curl',
  '2xx-response': '.json',
  java: '.java'
}

var httpMethods = ['POST', 'GET', 'PUT', 'DELETE']

var onWindows = process.platform === 'win32'

module.exports = {
  extension,
  acceptedLanguages,
  acceptedValidationLanguages,
  fileNameEnding,
  httpMethods,
  onWindows
}
