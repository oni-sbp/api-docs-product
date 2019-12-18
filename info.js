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

var onWindows = process.platform === 'win32'

module.exports = {
  extension,
  acceptedLanguages,
  acceptedValidationLanguages,
  fileNameEnding,
  httpMethods,
  onWindows
}
