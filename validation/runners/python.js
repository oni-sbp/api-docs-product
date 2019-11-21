const CodeRunner = require('./code').CodeRunner
const tempDirectory = require('temp-dir')
const fs = require('fs-extra')
const pathLib = require('path')
const utils = require('../utils')
const errors = require('../errors')
const debug = require('../../reporter').debug
const info = require('../../info')
const util = require('util')
const ejs = require('ejs')
const querystring = require('querystring')

class PythonRunner extends CodeRunner {
  constructor () {
    super()

    var tmpPath = tempDirectory
    this._virtualenvPath = tmpPath + pathLib.sep + info.conf.virtualenv_name
    this._pythonPath = this._virtualenvPath + pathLib.sep + 'bin' + pathLib.sep + 'python'

    this._createVirtualenvIfNeeded()
  }

  prepareSample (path, substitutions = {}) {
    var tmpSamplePath = tempDirectory + pathLib.sep + 'sample.py'
    var sampleCode = fs.readFileSync(path, 'utf8')
    sampleCode = this.makeSubstitutionsForNullParams(sampleCode, substitutions)
    var preparedCode = CodeRunner.replaceKeywords(sampleCode, substitutions)
    fs.writeFileSync(tmpSamplePath, preparedCode)

    return tmpSamplePath
  }

  makeSubstitutionsForNullParams (code, substitutions) {
    // If we have a body but we don't have an example
    if (substitutions['{BODY}']) {
      code = code.replace('body = {}', 'body = ' + substitutions['{BODY}'])
    }

    // Make substitutions for null values in headers, if we have a substitution for that
    var matches = code.match(/"\w+": null/g)
    for (var matchIndex in matches) {
      var match = matches[matchIndex].match(/"(?<paramName>\w+)": null/)
      var substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        code = code.replace(matches[matchIndex], util.format('"%s": %s', match.groups.paramName, substitution))
      } else {
        code = code.replace(matches[matchIndex], util.format('"%s": None', match.groups.paramName))
      }
    }

    // Make substitutions for empty values in querystring, if we have a substitution for that
    matches = code.match(/'\w+=[^&']*&/g)
    if (!matches) {
      match = code.match(/'(?<paramName>\w+)='/)
      if (match) {
        substitution = substitutions[util.format('{%s}', match.groups.paramName)]

        if (substitution) {
          substitution = querystring.escape(substitution)
          code = code.replace(match[0], util.format('\'%s=%s\'', match.groups.paramName, substitution))
        }
      }

      return code
    }

    match = matches[0].match(/'(?<paramName>\w+)=&/)
    if (match) {
      substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        substitution = querystring.escape(substitution)
        code = code.replace(match[0], util.format('\'%s=%s&', match.groups.paramName, substitution))
      }
    }

    match = code.match(/&(?<paramName>\w+)=&/)
    while (match) {
      substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        substitution = querystring.escape(substitution)
        code = code.replace(match[0], util.format('&%s=%s&', match.groups.paramName, substitution))
      }

      match = code.slice(match.index + match.groups.paramName.length + 3).match(/&(?<paramName>\w+)=&/)
    }

    match = code.match(/&(?<paramName>\w+)='/)
    if (match) {
      substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        substitution = querystring.escape(substitution)
        code = code.replace(match[0], util.format('&%s=%s\'', match.groups.paramName, substitution))
      }
    }

    return code
  }

  _createVirtualenvIfNeeded () {
    if (info.conf.always_create_environments && fs.existsSync(this._virtualenvPath)) {
      debug('Removing virtualenv: ' + this._virtualenvPath)
      fs.removeSync(this._virtualenvPath)
    }

    if (!fs.existsSync(this._pythonPath)) {
      debug('Creating virtualenv: ' + this._virtualenvPath)
      utils.runShellCommand('pip install virtualenv')

      if (!fs.existsSync(this._virtualenvPath)) {
        fs.mkdirSync(this._virtualenvPath)
      }
      utils.runShellCommand('virtualenv ' + this._virtualenvPath)

      this._installPythonPackages()
    }
  }

  _installPythonPackages () {
    var packages = ['requests']
    var pipPath = this._virtualenvPath + pathLib.sep + 'bin' + pathLib.sep + 'pip'

    utils.runShellCommand(pipPath + ' install ' + packages.join(' '), info.conf.virtualenv_creation_timeout, this._virtualenvPath)
  }

  _runSample (samplePath) {
    var result = utils.runShellCommand(this._pythonPath + ' ' + samplePath)
    var template = fs.readFileSync(info.templatesFolder + pathLib.sep + 'python-parse-stdout.ejs', 'utf8')
    var python = ejs.render(template, { stdout: result.stdout })
    var tmpPath = tempDirectory
    var filePath = tmpPath + pathLib.sep + 'python.py'
    fs.writeFileSync(filePath, python)
    var stdout = utils.runShellCommand(this._pythonPath + ' ' + filePath)
    if (!stdout.exitCode) {
      result.stdout = stdout.stdout
    }

    return result
  }

  _parseStdout (stdout, allowNonJSONResponse) {
    var rawResult
    try {
      rawResult = JSON.parse(stdout.trim())
    } catch {
      throw errors.OutputParsingError
    }

    if (rawResult.code === undefined || (rawResult.raw_body === undefined && !allowNonJSONResponse)) {
      throw errors.ConformToSchemaError
    }

    var statusCode = rawResult.code

    if (statusCode === 204) {
      return { jsonBody: null, statusCode: statusCode }
    }

    if (!rawResult.raw_body) {
      return { jsonBody: null, statusCode: statusCode }
    }

    var rawBody = rawResult.raw_body
    try {
      if (rawBody.constructor !== String) {
        return { jsonBody: rawBody, statusCode: statusCode }
      } else {
        return { jsonBody: JSON.parse(rawBody), statusCode: statusCode }
      }
    } catch {
      if (allowNonJSONResponse) {
        return { jsonBody: null, statusCode: statusCode }
      }

      throw errors.OutputParsingError
    }
  }
}

module.exports = {
  PythonRunner
}
