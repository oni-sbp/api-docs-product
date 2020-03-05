const fs = require('fs')
const validationClasses = require('../validation-classes')
const error = require('../errors')
const path = require('path')

class CodeRunner {
  constructor (request) {
    this.request = request
    this.tmpSamplePath = null
  }

  _runSample (samplePath) {
    throw new Error('You haven\'t implemented this method')
  }

  _parseStdout (stdout, allowNonJSONResponse) {
    throw new Error('You haven\'t implemented this method')
  }

  prepareSample (path, substitutions = null) {
    throw new Error('You haven\'t implemented this method')
  }

  makeSubstitutionsForNullParams (code) {
    throw new Error('You haven\'t implemented this method')
  }

  _fileExists (path) {
    try {
      if (fs.existsSync(path)) {
        return true
      }
    } catch {
      return false
    }
  }

  _cleanup (sample) {
    if (this.tmpSamplePath && fs.existsSync(this.tmpSamplePath) && this.tmpSamplePath !== sample.path) {
      fs.unlinkSync(this.tmpSamplePath)
    }
  }

  runSample (sample, substitutions = null) {
    substitutions = substitutions || {}
    var _substitutions = CodeRunner.getSubstitutionsFromDebugFile(sample)
    _substitutions = Object.assign(_substitutions, substitutions)
    this.tmpSamplePath = this.prepareSample(sample.path, _substitutions)

    try {
      var apiTestResult = this.analyzeResult(sample)
      apiTestResult.sourceCode = fs.readFileSync(this.tmpSamplePath, 'utf8')

      return apiTestResult
    } finally {
      this._cleanup(sample)
    }
  }

  static getSubstitutionsFromDebugFile (sample) {
    var debugPath = path.dirname(sample.path) + path.sep + 'debug.json'
    var debug = fs.readFileSync(debugPath, 'utf8').toString()
    var sourceCode = fs.readFileSync(sample.path, 'utf8').toString()
    debug = JSON.parse(debug)
    var substitutions = {}
    for (var parameter in debug) {
      substitutions['{' + parameter + '}'] = debug[parameter]
    }

    var regexCurlFirst = /\\"(?<name>\w+)\\": ?\\"<(?<paramValue>.+)>\\"/
    var regexCurl = /\\"(?<name>\w+)\\": ?\\"<(?<paramValue>.+)>\\"/g
    var regexCurlArrayFirst = /\\"(?<name>\w+)\\": ?(?<paramValue>\[.+\])/
    var regexCurlArray = /\\"(?<name>\w+)\\": ?(?<paramValue>\[.+\])/g
    var regexPythonFirst = /"(?<name>\w+)": ?"<(?<paramValue>.+)>"/
    var regexPython = /"(?<name>\w+)": ?"<(?<paramValue>.+)>"/g
    var regexPythonArrayFirst = /"(?<name>\w+)": ?(?<paramValue>\[.+\])/
    var regexPythonArray = /"(?<name>\w+)": ?(?<paramValue>\[.+\])/g

    var matchCurl = sourceCode.match(regexCurl)
    for (var matchIndex in matchCurl) {
      var matchString = matchCurl[matchIndex]
      var match = matchString.match(regexCurlFirst)

      if (match.groups.name in debug) {
        substitutions['<' + match.groups.paramValue + '>'] = debug[match.groups.name]
      }
    }

    var matchCurlArray = sourceCode.match(regexCurlArray)

    for (matchIndex in matchCurlArray) {
      matchString = matchCurlArray[matchIndex]
      match = matchString.match(regexCurlArrayFirst)

      var jsonArray = JSON.stringify(debug[match.groups.name])
      if (jsonArray) {
        var escapedJsonArray = jsonArray.replace(/"/g, '\\"')

        substitutions[match.groups.paramValue] = escapedJsonArray
      }
    }

    var matchPython = sourceCode.match(regexPython)
    for (matchIndex in matchPython) {
      matchString = matchPython[matchIndex]
      match = matchString.match(regexPythonFirst)

      if (match.groups.name in debug) {
        substitutions['<' + match.groups.paramValue + '>'] = debug[match.groups.name]
      }
    }

    var matchPythonArray = sourceCode.match(regexPythonArray)
    for (matchIndex in matchPythonArray) {
      matchString = matchPythonArray[matchIndex]
      match = matchString.match(regexPythonArrayFirst)

      jsonArray = JSON.stringify(debug[match.groups.name])

      substitutions[match.groups.paramValue] = jsonArray
    }

    return substitutions
  }

  analyzeResult (sample) {
    var startTime = new Date()
    var cmdResult, statusCode, jsonBody

    try {
      cmdResult = this._runSample(this.tmpSamplePath)
    } catch (error) {
      return new validationClasses.ApiTestResult(this.request, {
        sample: sample,
        passed: false,
        reason: error,
        duration: this.request.conf.sample_timeout
      })
    }

    var duration = new Date() - startTime

    if (cmdResult.exitCode !== 0) {
      return new validationClasses.ApiTestResult(this.request, {
        sample: sample,
        passed: false,
        reason: error.NonZeroExitCode,
        cmdResult: cmdResult,
        duration: duration
      })
    }

    try {
      var allowNonJSONResponse = false
      if (this.request.conf.allow_non_json_responses[sample.name] && this.request.conf.allow_non_json_responses[sample.name][sample.httpMethod]) {
        allowNonJSONResponse = this.request.conf.allow_non_json_responses[sample.name][sample.httpMethod]
      }

      var parsedStdout = this._parseStdout(cmdResult.stdout, allowNonJSONResponse)
      jsonBody = parsedStdout.jsonBody
      statusCode = parsedStdout.statusCode
    } catch (error) {
      return new validationClasses.ApiTestResult(this.request, {
        sample: sample,
        passed: false,
        reason: error,
        cmdResult: cmdResult,
        duration: duration
      })
    }

    if (statusCode >= 400) {
      return new validationClasses.ApiTestResult(this.request, {
        sample: sample,
        passed: false,
        reason: error.BadRequest,
        cmdResult: cmdResult,
        jsonBody: jsonBody,
        statusCode: statusCode,
        duration: duration
      })
    }

    return new validationClasses.ApiTestResult(this.request, {
      sample: sample,
      passed: true,
      reason: null,
      cmdResult: cmdResult,
      jsonBody: jsonBody,
      statusCode: statusCode,
      duration: duration
    })
  }

  static replaceKeywords (text, substitutions) {
    for (var replaceFrom in substitutions) {
      text = text.replace(replaceFrom, substitutions[replaceFrom], 'g')
    }

    return text
  }
}

module.exports = {
  CodeRunner
}
