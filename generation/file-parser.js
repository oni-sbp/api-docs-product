const ramlParser = require('./raml-parser')
const openAPIParser = require('./openapi-parser')

async function parse (path, rootDirectory, examplesPath, request) {
  var params = {}

  if (request.scheme !== '') {
    params.scheme = request.scheme
  }

  if (request.host !== '') {
    params.server_name = request.host
  }

  if (path.endsWith('.raml')) {
    return ramlParser.parse(path, rootDirectory, examplesPath, params, request)
  } else if (path.endsWith('.json') || path.endsWith('.yaml')) {
    return openAPIParser.parse(path, rootDirectory, examplesPath, params, request)
  } else {
    return ''
  }
}

module.exports = {
  parse
}
