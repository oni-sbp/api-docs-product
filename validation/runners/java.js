const CodeRunner = require('./code').CodeRunner
const pathLib = require('path')
const tempDirectory = require('temp-dir')
const fs = require('fs-extra')
const errors = require('../errors')
const utils = require('../utils')
const info = require('../../info')
const util = require('util')
const querystring = require('querystring')

class JavaRunner extends CodeRunner {
  constructor (request) {
    super(request)
    var tmpPath = tempDirectory
    this._projectDirPath = tmpPath + pathLib.sep + '.pot-Java'
    if (!fs.existsSync(this._projectDirPath)) {
      fs.mkdirSync(this._projectDirPath)
    }
    var firstJarSave = this._projectDirPath + pathLib.sep + 'commons-logging-1.2.jar'
    if (!fs.existsSync(this.firstJarSave)) {
      fs.copyFile('resources' + pathLib.sep + 'Jars' + pathLib.sep + 'commons-logging-1.2.jar', firstJarSave)
    }
    var sevondJarSave = this._projectDirPath + pathLib.sep + 'httpclient-4.5.10.jar'
    if (!fs.existsSync(this.sevondJarSave)) {
      fs.copyFile('resources' + pathLib.sep + 'Jars' + pathLib.sep + 'httpclient-4.5.10.jar', sevondJarSave)
    }
    var thirdJarSave = this._projectDirPath + pathLib.sep + 'httpcore-4.4.12.jar'
    if (!fs.existsSync(this.thirdJarSave)) {
      fs.copyFile('resources' + pathLib.sep + 'Jars' + pathLib.sep + 'httpcore-4.4.12.jar', thirdJarSave)
    }
  }

  prepareSample (path, substitutions = {}) {
    var tmpSamplePath = this._projectDirPath + pathLib.sep + 'Java.java'
    var sampleCode = fs.readFileSync(path, 'utf8')
    sampleCode = this.makeSubstitutionsForNullParams(sampleCode, substitutions)
    var preparedCode = CodeRunner.replaceKeywords(sampleCode, substitutions)
    fs.writeFileSync(tmpSamplePath, preparedCode)
    return tmpSamplePath
  }

  makeSubstitutionsForNullParams (code, substitutions) {
    // If we have a body but we don't have an example
    if (substitutions['{BODY}']) {
      var newBody = substitutions['{BODY}']
      newBody = newBody.split('"').join('\\"').replace(/(\r\n|\n|\r)/gm, '')
      code = code.replace('StringEntity params =new StringEntity("{}");', 'StringEntity params =new StringEntity("' + newBody + '");')
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
    if (info.onWindows) {
      utils.runShellCommand('del Java.class', 20, this._projectDirPath)
      utils.runShellCommand('javac -cp * Java.java', 20, this._projectDirPath)
      return utils.runShellCommand('java -cp .;* Java', this.request.conf.sample_timeout, this._projectDirPath)
    } else {
      utils.runShellCommand('rm Java.class', 20, this._projectDirPath)
      utils.runShellCommand('javac -cp "*" Java.java', 20, this._projectDirPath)
      return utils.runShellCommand('java -cp .:* Java', this.request.conf.sample_timeout, this._projectDirPath)
    }
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

    if (rawResult.raw_body.constructor === Array || rawResult.raw_body.constructor === Object) {
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
  JavaRunner
}
