const wap = require('webapi-parser').WebApiParser
const querystring = require('querystring')
const write = require('./write-templates')
const pathLib = require('path')
const reporter = require('../reporter')

async function parse (path, rootDirectory, examplesPath, params, request) {
  var filename = pathLib.parse(path).base

  reporter.log(request, 'Parsing ' + filename)

  var directory = pathLib.dirname(path)

  process.chdir(directory)
  var model = await wap.raml10.parse(`file://${filename}`).catch((err) => {
    if (err) {
      return -1
    }
  })

  const api = model.encodes
  var debug = makeDebug(api)

  var title = filename.split('.')[0]
  try {
    title = api.name.value()
  } catch {
    reporter.log(request, 'This API specification does not have a title')
  }

  var contentType = null
  if (api.contentType.length > 0) {
    contentType = api.contentType[0].value()
  }

  if (!params.server_name && api.servers && api.servers.length > 0) {
    params.scheme = api.servers[0].url.value().split('://')[0]
    params.server_name = api.servers[0].url.value().split('://')[1]
  }

  if (!params.scheme && api.servers && api.servers.length > 0) {
    params.scheme = api.servers[0].url.value().split('://')[0]
  }

  for (var endpoint in api.endPoints) {
    var endPoint = api.endPoints[endpoint]
    params.uri = endPoint.path.value()

    for (var operationIndex in endPoint.operations) {
      var operation = endPoint.operations[operationIndex]

      params.desc = operation.description.value()
      params.ok = get2xxResponse(operation)
      params.request_method = operation.method.value()

      var queryString = getQueryString(operation)
      if (queryString) {
        params.query_string = queryString
      }

      setBody(operation, params)

      setHeaders(operation, contentType, params, request)

      setCurl(params)
      write.writeExampleFiles(params, examplesPath, rootDirectory, request)
      write.writeDebug(debug, params, examplesPath)

      params.desc = null
      params.ok = null
      params.request_method = null
      params.body = null
      params.headers = null
      params.query_string = null
      params.curl = null
      params.pyBody = null
      params.javaBody = null
      params.javaHeaders = null
    }
  }

  process.chdir(rootDirectory)

  return title
}

function makeDebug (api) {
  var debug = {}

  for (var endpoint in api.endPoints) {
    var endPoint = api.endPoints[endpoint]

    for (var parameterIndex in endPoint.parameters) {
      var parameter = endPoint.parameters[parameterIndex]

      getDebugFromParameter(parameter, debug)
    }

    for (var operationIndex in endPoint.operations) {
      var operation = endPoint.operations[operationIndex]

      if (operation.request) {
        for (var headerIndex in operation.request.headers) {
          var header = operation.request.headers[headerIndex]

          getDebugFromParameter(header, debug)
        }

        for (parameterIndex in operation.request.queryParameters) {
          parameter = operation.request.queryParameters[parameterIndex]

          getDebugFromParameter(parameter, debug)
        }
      }
    }
  }

  return debug
}

function getDebugFromParameter (parameter, debug) {
  if (parameter.name.isNull || !parameter.schema) {
    return
  }

  for (var exampleIndex in parameter.schema.examples) {
    var example = parameter.schema.examples[exampleIndex]

    if (example.structuredValue && !example.structuredValue.dataType.isNull) {
      if (!example.structuredValue.value.isNull) {
        debug[parameter.name.value()] = example.structuredValue.value.value()

        return
      } else if (!parameter.description.isNull) {
        debug[parameter.name.value()] = 'STUB'
      }
    }
  }
}

function setHeaders (operation, contentType, params, request) {
  var headers = {}
  if (operation.request) {
    for (var headerIndex in operation.request.headers) {
      var header = operation.request.headers[headerIndex]
      var foundExample = false

      if (header.parameterName != null && header.schema != null) {
        for (var exampleIndex in header.schema.examples) {
          var example = header.schema.examples[exampleIndex]

          if (example.toJson != null && isJsonString(example.toJson)) {
            headers[header.parameterName.value()] = JSON.parse(example.toJson)
            foundExample = true
            break
          }
        }

        if (!foundExample) {
          headers[header.parameterName.value()] = null
        }
      }
    }
  }

  if (contentType && !headers['Content-Type'] && params.body != null && params.body !== {}) {
    headers['Content-Type'] = contentType
  }

  if (request.authentication !== 'None' && headers.Authorization === undefined) {
    headers.Authorization = request.authentication + ' <ACCESS_TOKEN>'
  }

  if (JSON.stringify(headers) !== JSON.stringify({})) {
    params.headers = JSON.stringify(headers, null, 4)
  }

  var toParseAsJavaHeader = []
  if (params.headers) {
    toParseAsJavaHeader = params.headers.split('"')
  }
  params.javaHeaders = ''
  for (var index = 1; index < toParseAsJavaHeader.length; index += 4) {
    params.javaHeaders += '\t\t\t' + 'request.addHeader("' + toParseAsJavaHeader[index] + '", "' + toParseAsJavaHeader[index + 2] + '");\n'
  }
}

function isJsonString (string) {
  try {
    JSON.parse(string)
  } catch (e) {
    return false
  }

  return true
}

function getQueryString (operation) {
  var params = {}
  if (operation.request) {
    for (var parameterIndex in operation.request.queryParameters) {
      var parameter = operation.request.queryParameters[parameterIndex]
      var foundExample = false

      if (parameter.name && parameter.schema) {
        for (var exampleIndex in parameter.schema.examples) {
          var example = parameter.schema.examples[exampleIndex]

          if (example.toJson != null && isJsonString(example.toJson)) {
            params[parameter.name.value()] = JSON.parse(example.toJson)
            foundExample = true

            break
          }
        }
      }

      if (!foundExample) {
        params[parameter.name.value()] = null
      }
    }
  }

  if (params !== {}) {
    return querystring.stringify(params)
  }

  return null
}

function setBody (operation, params) {
  if (operation.request) {
    for (var i = 0; i < operation.request.payloads.length; ++i) {
      if (operation.request.payloads[i].schema != null) {
        for (var exampleIndex in operation.request.payloads[i].schema.examples) {
          var example = operation.request.payloads[i].schema.examples[exampleIndex]

          if (example.toJson != null) {
            params.body = example.toJson
            params.pyBody = params.body
            var checkBoolValue = params.pyBody.split('"')
            for (var index = 0; index < checkBoolValue.length; index += 2) {
              if (checkBoolValue[index].includes('true')) {
                checkBoolValue[index] = checkBoolValue[index].split('true').join('True')
              }
              if (checkBoolValue[index].includes('false')) {
                checkBoolValue[index] = checkBoolValue[index].split('false').join('False')
              }
            }
            params.pyBody = checkBoolValue.join('"')
            checkBoolValue = params.pyBody.split("'")
            for (index = 0; index < checkBoolValue.length; index += 2) {
              if (checkBoolValue[index].includes('true')) {
                checkBoolValue[index] = checkBoolValue[index].split('true').join('True')
              }
              if (checkBoolValue[index].includes('false')) {
                checkBoolValue[index] = checkBoolValue[index].split('false').join('False')
              }
            }
            params.pyBody = checkBoolValue.join("'")

            params.javaBody = params.body
            params.javaBody = params.javaBody.split('"').join('\\"').split(/\r\n|\r|\n/).join('')

            return
          }
        }
      }
    }

    if (operation.request.payloads.length > 0) {
      params.body = JSON.stringify({})
      params.pyBody = JSON.stringify({})
      params.javaBody = JSON.stringify({})
    }
  }
}

function get2xxResponse (operation) {
  var noExample = { status: '', body: '' }
  for (var responseIndex in operation.responses) {
    var response = operation.responses[responseIndex]

    if (response.statusCode != null && response.statusCode.value()[0] === '2') {
      noExample.status = response.statusCode.value()
      for (var payloadIndex in response.payloads) {
        var payload = response.payloads[payloadIndex]

        if (payload.schema) {
          for (var exampleIndex in payload.schema.examples) {
            var example = payload.schema.examples[exampleIndex]

            if (example.toJson != null) {
              return {
                status: response.statusCode.value(),
                body: example.toJson
              }
            }
          }
        }
      }
    }
  }

  return noExample
}

function setCurl (params) {
  var curl = 'curl -i -X ' + params.request_method.toUpperCase() + ' \\\n'

  if (params.headers) {
    var jsonHeaders = JSON.parse(params.headers)

    for (var header in jsonHeaders) {
      curl += '   -H "' + header + ': ' + jsonHeaders[header] + '" \\\n'
    }
  }

  if (params.body) {
    curl += '   -d \\\n'
    curl += '"'
    if (params.body[params.body.length - 1] === '\n') {
      params.body = params.body.slice(0, -1)
    }
    curl += params.body.replace(/"/g, '\\"')
    curl += '"'
  }

  curl += ' "' + params.scheme + '://' + params.server_name + params.uri + ((params.query_string) ? '?' + params.query_string : '') + '"'
  params.curl = curl
}

module.exports = {
  parse,
  setCurl
}
