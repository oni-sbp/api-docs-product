const CodeRunner = require('./code').CodeRunner
const tempDirectory = require('temp-dir')
const fs = require('fs-extra')
const errors = require('../errors')
const utils = require('../utils')
const pathLib = require('path')
const debug = require('../../reporter').debug
const util = require('util')
const querystring = require('querystring')

class NodeRunner extends CodeRunner {
  constructor (request) {
    super(request)

    var tmpPath = tempDirectory
    this._projectDirPath = tmpPath + pathLib.sep + request.conf.js_project_dir_name
    this._nodeModulesPath = this._projectDirPath + pathLib.sep + 'node_modules'
    this._installNodeModulesIfNeeded()
  }

  _installNodeModulesIfNeeded () {
    var packages = ['unirest']

    if (this.request.conf.always_create_environments && fs.existsSync(this._projectDirPath)) {
      debug(this.request, 'Removing ' + this._projectDirPath)
      fs.removeSync(this._projectDirPath)
    }
    if (!fs.existsSync(this._projectDirPath)) {
      fs.mkdirSync(this._projectDirPath)
      debug(this.request, 'Installing node modules to ' + this._projectDirPath)
      utils.runShellCommand('npm install ' + packages.join(' '), this.request.conf.virtualenv_creation_timeout, this._projectDirPath)
    }
  }

  prepareSample (path, substitutions = {}) {
    var tmpSamplePath = this._projectDirPath + pathLib.sep + 'sample.js'
    var sampleCode = fs.readFileSync(path, 'utf8')
    sampleCode = this.makeSubstitutionsForNullParams(sampleCode, substitutions)
    var preparedCode = CodeRunner.replaceKeywords(sampleCode, substitutions)
    fs.writeFileSync(tmpSamplePath, preparedCode)

    return tmpSamplePath
  }

  makeSubstitutionsForNullParams (code, substitutions) {
    // If we have a body but we don't have an example
    if (substitutions['{BODY}']) {
      code = code.replace('const body = {};', 'const body = ' + substitutions['{BODY}'] + ';')
    }

    // Make substitutions for null values in headers, if we have a substitution for that
    var matches = code.match(/"\w+": null/g)

    for (var matchIndex in matches) {
      var match = matches[matchIndex].match(/"(?<paramName>\w+)": null/)
      var substitution = substitutions[util.format('{%s}', match.groups.paramName)]

      if (substitution) {
        code = code.replace(matches[matchIndex], util.format('"%s": %s', match.groups.paramName, substitution))
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

  _runSample (samplePath) {
    if (!this.tmpSamplePath) {
      throw new Error('Temporary sample was not created')
    }

    var nodeBin = 'node'

    return utils.runShellCommand(nodeBin + ' ' + samplePath, null, this._projectDirPath)
  }

  _parseStdout (stdout, allowNonJSONResponse) {
    var rawResult
    try {
      rawResult = JSON.parse(stdout.trim())
    } catch {
      throw errors.OutputParsingError
    }

    if (rawResult.code === undefined || (rawResult.raw_body === undefined && !allowNonJSONResponse && rawResult.code !== 204)) {
      throw errors.ConformToSchemaError
    }

    var statusCode = rawResult.code

    if (statusCode === 204) {
      return { jsonBody: null, statusCode: statusCode }
    }

    if (!rawResult.raw_body) {
      return { jsonBody: null, statusCode: statusCode }
    }

    if (rawResult.raw_body.constructor === Object) {
      return { jsonBody: rawResult.raw_body, statusCode: statusCode }
    }

    try {
      return { jsonBody: JSON.parse(rawResult.raw_body), statusCode: statusCode }
    } catch {
      if (allowNonJSONResponse) {
        return { jsonBody: null, statusCode: statusCode }
      }

      throw errors.OutputParsingError
    }
  }
}

module.exports = {
  NodeRunner
}
