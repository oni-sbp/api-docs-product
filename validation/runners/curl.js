const CodeRunner = require('./code').CodeRunner
const fs = require('fs')
const utils = require('../utils')
const errors = require('../errors.js')
const tempDirectory = require('temp-dir')
const pathLib = require('path')
const util = require('util')
const querystring = require('querystring')

class CurlRunner extends CodeRunner {
  constructor(request) {
    super(request)
  }

  prepareSample(path, substitutions = {}) {
    var tmpSamplePath = tempDirectory + pathLib.sep + 'curl'
    var sampleCode = fs.readFileSync(path, 'utf8')
    sampleCode = this.makeSubstitutionsForNullParams(sampleCode, substitutions)
    var preparedCode = CodeRunner.replaceKeywords(sampleCode, substitutions)
    fs.writeFileSync(tmpSamplePath, preparedCode)

    return tmpSamplePath
  }

  makeSubstitutionsForNullParams(code, substitutions) {
    // If we have a body but we don't have an example
    if (substitutions['{BODY}']) {
      code = code.replace('"{}"', '"' + substitutions['{BODY}'] + '"')
    }

    // Add placeholders for null values in headers, if we have a substitution for that
    var matches = code.match(/"\w+: null"/g)

    for (var matchIndex in matches) {
      var match = matches[matchIndex].match(/"(?<paramName>\w+): null"/)
      var substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        code = code.replace(matches[matchIndex], util.format('"%s: {%s}"', match.groups.paramName, match.groups.paramName))
      }
    }

    // Make substitutions for empty values in querystring, if we have a substitution for that
    matches = code.match(/\w+=[^&"]*/g)

    for (matchIndex in matches) {
      match = matches[matchIndex].match(/(?<paramName>\w+)=(?<paramValue>[^&"]*)/)

      if (match.groups.paramValue.length === 0) {
        substitution = substitutions[util.format('{%s}', match.groups.paramName)]

        if (substitution) {
          substitution = querystring.escape(substitution)
          code = code.replace(matches[matchIndex], util.format('%s=%s', match.groups.paramName, substitution))
        }
      }
    }

    return code
  }

  _runSample(samplePath) {
    var bashBin = '/bin/bash'

    return utils.runShellCommand(bashBin + ' ' + samplePath, this.request.conf.sample_timeout)
  }

  _parseStdout(stdout, allowNonJSONResponse) {
    var statusCode = null
    var body = null

    try {
      var trimmed = stdout.trim()
      trimmed = trimmed.replace(/\r/g, '').split('\n\n')

      if (trimmed[0].search('HTTP/1.1 200 Connection established') !== -1) {
        var match = trimmed[1].match(/HTTP.*? (?<code>[0-9]+) /)
        if (match) {
          statusCode = match.groups.code
        }

        body = trimmed[2]
      } else {
        match = trimmed[0].match(/HTTP.*? (?<code>[0-9]+) /)
        if (match) {
          statusCode = match.groups.code
        }

        body = trimmed[1]
      }
    } catch (error) {
      if (statusCode === '204' || allowNonJSONResponse) {
        return { jsonBody: null, statusCode: statusCode }
      }

      throw errors.OutputParsingError
    }

    if (body === undefined && !allowNonJSONResponse) {
      if (statusCode === '204') {
        return { jsonBody: null, statusCode: statusCode }
      }

      throw errors.OutputParsingError
    }

    var jsonBody
    try {
      jsonBody = JSON.parse(body)
    } catch (error) {
      if (allowNonJSONResponse) {
        return { jsonBody: null, statusCode: statusCode }
      }

      throw errors.OutputParsingError
    }

    return { jsonBody: jsonBody, statusCode: statusCode }
  }
}

module.exports = {
  CurlRunner
}
