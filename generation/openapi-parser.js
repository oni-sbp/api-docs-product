const write = require('./write-templates')
const pathUtility = require('path')
const querystring = require('querystring')
const SwaggerParser = require('swagger-parser')
const ramlParser = require('./raml-parser')
const reporter = require('../reporter')

async function parse(path, rootDirectory, examplesPath, params, request) {
  reporter.log(request, 'Parsing ' + path)
  var api = await SwaggerParser.dereference(path).catch((error) => {
    console.log(error)
  })

  if (!api) {
    return ''
  }

  var filename = pathUtility.parse(path).base
  var title = filename.split('.')[0]

  if (api.info && api.info.title) {
    title = api.info.title.replace('Swagger', '').trim()
  } else {
    reporter.log(request, 'This API specification does not have a title')
  }

  var contentType = null

  if (api.consumes && api.consumes.length > 0) {
    contentType = api.consumes[0]
  } else if (api.produces && api.produces.length > 0) {
    contentType = api.produces[0]
  } else {
    contentType = 'application/json'
  }

  if (!params.scheme) {
    if (api.schemes && api.schemes.length > 0) {
      params.scheme = api.schemes[0]

      if (api.schemes.includes('https')) {
        params.scheme = 'https'
      }
    } else if (api.servers && api.servers.length > 0) {
      params.scheme = api.servers[0].url.split('://')[0]
    }
  }

  if (!params.server_name) {
    if (api.servers && api.servers.length > 0) {
      params.scheme = api.servers[0].url.split('://')[0]
      params.server_name = api.servers[0].url.split('://')[1]
    } else if (api.host) {
      params.server_name = api.host
      if (api.basePath) {
        params.server_name += api.basePath
      }
    }
  }
  if (params.server_name.endsWith('/')) {
    params.server_name = params.server_name.slice(0, params.server_name.length - 1)
  }
  var debug = {}
  getDebug(api, debug)

  for (var uri in api.paths) {
    var endPoint = api.paths[uri]
    params.uri = uri

    if (uri === '/pet/findByTags' || uri === '/pet/{petId}/uploadImage') {
      continue /// ////////////////////
    }

    for (var operation in endPoint) {
      if (operation !== 'parameters') {
        params.request_method = operation
        params.desc = endPoint[operation].description

        params.ok = get2xxResponse(endPoint[operation])

        var queryString = getQueryString(endPoint[operation])
        if (queryString) {
          params.query_string = queryString
        }

        var bodyValue = getBody(endPoint[operation], request)
        if (bodyValue) {
          params.body = bodyValue
          params.pyBody = bodyValue
          params.javaBody = bodyValue
          setBody(endPoint[operation], params)
        } else {
          params.pyBody = ''
          params.javaBody = ''
        }

        setHeaders(endPoint[operation], contentType, params, request)

        ramlParser.setCurl(params)

        write.writeExampleFiles(params, examplesPath, rootDirectory, request)
        write.writeDebug(debug, params, examplesPath)

        params.desc = null
        params.ok = null
        params.request_method = null
        params.body = null
        params.headers = null
        params.query_string = null
        params.pyBody = null
        params.javaHeaders = null

      }
    }
  }

  return title
}

function getDebug(dict, debug) {
  for (var key in dict) {
    var data = dict[key]

    if (data == null) {
      continue
    }

    if (data.constructor === Object) {
      var type = data.type
      var example = data.example
      var description = data.description

      if (type && example) {
        var paramKey = key.replace('?', '')
        var paramValue

        if (type === 'array') {
          paramValue = example
        } else {
          paramValue = example.toString()
        }

        debug[paramKey] = paramValue
      } else if (type && description) {
        paramKey = key.replace('?', '')
        debug[paramKey] = 'STUB'
      } else {
        getDebug(data, debug)
      }
    } else if (data.constructor === Array) {
      for (var index in data) {
        getDebug(data[index], debug)
      }
    }
  }


}

function get2xxResponse(operation) {
  var noExample = { status: '', body: '' }
  if (operation.responses) {
    for (var response in operation.responses) {
      if (response.startsWith('2')) {
        noExample.status = response
        var example = getExample(operation.responses[response])

        if (example) {
          return {
            status: response,
            body: example
          }
        }
      }
    }
  }

  return noExample
}

function getQueryString(operation) {
  var params = {}
  if (operation.parameters) {
    for (var parameterIndex in operation.parameters) {
      var parameter = operation.parameters[parameterIndex]

      if (parameter.in === 'query') {
        var example = getExample(parameter)

        if (example) {
          params[parameter.name] = example
        } else {
          params[parameter.name] = null
        }
      }
    }
  }

  if (JSON.stringify(params) !== JSON.stringify({})) {
    return querystring.stringify(params)
  }

  return null
}

function getBody(operation, request) {
  var hasBody = false

  if (operation.requestBody) {
    hasBody = true

    if (request.conf.ignore_body_examples) {
      return JSON.stringify({})
    }

    var example = getExample(operation.requestBody)

    if (example) {
      return JSON.stringify(example)
    }
  }

  if (operation.parameters) {
    for (var parameterIndex in operation.parameters) {
      var parameter = operation.parameters[parameterIndex]

      if (parameter.in === 'body') {
        hasBody = true

        if (request.conf.ignore_body_examples) {
          return JSON.stringify({})
        }
        example = getExample(parameter)

        if (example) {
          return JSON.stringify(example)
        }
      }
    }
  }

  if (hasBody) {
    return JSON.stringify({})
  }

  return null
}

function setBody(operation, params) {
  if (params.body) {
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
    params.body = JSON.stringify({})
    params.pyBody = JSON.stringify({})
    params.javaBody = JSON.stringify({})
  }
}


function setHeaders(operation, contentType, params, request) {
  var headers = {}

  if (operation.parameters) {
    for (var parameterIndex in operation.parameters) {
      var parameter = operation.parameters[parameterIndex]

      if (parameter.in === 'header') {
        var example = getExample(parameter)

        if (example) {
          headers[parameter.name] = example
        } else {
          headers[parameter.name] = null
        }
      }
    }

  }

  if (contentType && !headers['Content-Type'] && params.body != null && JSON.stringify(params.body) !== JSON.stringify({})) {
    headers['Content-Type'] = contentType
  }

  if (request.authentication !== 'None' && headers.Authorization === undefined) {
    headers.Authorization = request.authentication + ' <ACCESS_TOKEN>'
  }

  if (JSON.stringify(headers) !== JSON.stringify({})) {
    params.headers = JSON.stringify(headers, null, 4)
    var toParseAsJavaHeader = params.headers.split('"')
    params.javaHeaders = ''
    for (var index = 1; index < toParseAsJavaHeader.length; index += 4) {
      params.javaHeaders += '\t\t\t' + 'request.addHeader("' + toParseAsJavaHeader[index] + '", "' + toParseAsJavaHeader[index + 2] + '");\n'
    }
  } else { params.javaHeaders = '' }
}

function getExample(parameter) {
  if (parameter.content) {
    for (var type in parameter.content) {
      var example = getExample(parameter.content[type])

      if (example) {
        return example
      }
    }
  }

  if (parameter.schema) {
    example = getExample(parameter.schema)
    if (example) {
      return example
    }

    if (parameter.schema.properties) {
      example = {}
      for (var property in parameter.schema.properties) {
        var propertyExample = getExample(parameter.schema.properties[property])

        if (propertyExample) {
          example[property] = JSON.parse(propertyExample)
        }
      }

      if (JSON.stringify(example) !== JSON.stringify({})) {
        return JSON.stringify(example)
      }
    }
  }

  if (parameter.example) {
    return JSON.stringify(parameter.example)
  }

  if (parameter.examples) {
    for (example in parameter.examples) {
      if (parameter.examples[example].value) {
        return JSON.stringify(parameter.examples[example].value)
      }

      return JSON.stringify(parameter.examples[example])
    }
  }

  return null
}

module.exports = {
  parse
}
