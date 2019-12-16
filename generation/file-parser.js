const ramlParser = require('./raml-parser')
const openAPIParser = require('./openapi-parser')

async function parse (path, rootDirectory, examplesPath, host, scheme, request) {
  var params = {}

  if (scheme !== '') {
    params.scheme = scheme
  }

  if (host !== '') {
    params.server_name = host
  }

  if (path.endsWith('.raml')) {
    return ramlParser.parse(path, rootDirectory, examplesPath, params, request)
  } else if (path.endsWith('.json') || path.endsWith('.yaml')) {
    return openAPIParser.parse(path, rootDirectory, examplesPath, params, request)
  } else {
    return ""
  }
}

module.exports = {
  parse
}
