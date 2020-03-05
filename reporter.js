const color = require('node-colorify')
const mongoDBManager = require('./mongoDBManager')
const info = require('./info')

function debug (request, message) {
  console.log(color.colorItSync(message, { fColor: 'blue' }))
  request.logFileStream.write(message + '\n')
}

function log (request, message, noNewLine = false) {
  console.log(message.toString())
  if (!noNewLine) {
    message += '\n'
  }
  request.logFileStream.write(message.toString())
}

function logRed (request, message) {
  console.log(color.colorItSync(message, { fColor: 'red' }))
  request.logFileStream.write(message + '\n')
}

function logGreen (request, message) {
  console.log(color.colorItSync(message, { fColor: 'green' }))
  request.logFileStream.write(message + '\n')
}

function logYellow (request, message) {
  console.log(color.colorItSync(message, { fColor: 'yellow' }))
  request.logFileStream.write(message + '\n')
}

class Reporter {
  constructor (request) {
    this.request = request
  }

  _explainNonZeroCode (testResult, request) {
    if (!testResult.cmdResult) {
      return
    }

    var code = testResult.cmdResult.exitCode
    log(request, 'Command returned non-zero exit code: ' + code)
    Reporter._printStdoutAndStderr(testResult, request)
  }

  static _explainStdoutParsing (testResult, request) {
    if (!testResult.cmdResult) {
      return
    }

    var stdout = testResult.cmdResult.stdout
    var stderr = testResult.cmdResult.stderr

    if (stdout.trim()) {
      log(request, 'Incorrect sample output:\n' + stdout)
    } else {
      log(request, 'No stdout captured')

      if (stderr) {
        log(request, 'STDERR:\n' + stderr)
      }
    }
  }

  static _printStdoutAndStderr (testResult, request) {
    var stdoutDesc, stderrDesc

    if (testResult.cmdResult) {
      var stdout = testResult.cmdResult.stdout.toString().trim()
      var stderr = testResult.cmdResult.stderr.toString().trim()

      stdoutDesc = stdout ? 'STDOUT:\n' + stdout : 'NO STDOUT'
      stderrDesc = stderr ? 'STDERR:\n' + stderr : 'NO STDERR'
    } else {
      stdoutDesc = 'NO STDOUT'
      stderrDesc = 'NO STDERR'
    }

    log(request, stdoutDesc + '\n' + stderrDesc)
  }

  _explainBadRequest (testResult, request) {
    log(request, 'Bad request: ' + testResult.statusCode)
    Reporter._printStdoutAndStderr(testResult, request)
  }

  static _explainTimeoutError (testResult, request) {
    log(request, 'Timeout error: ' + request.conf.sample_timeout + 's')
  }

  static _printSampleSourceCode (testResult, request) {
    var code = testResult.sourceCode
    log(request, 'Sample source code (with substitutions):\n' + code)
  }

  static _explainConformingToSchema (testResult, request) {
    if (['python', 'unirest.node'].includes(testResult.sample.language())) {
      log(request, 'Resulted JSON must contain "raw_body" and "code" fields')
    }

    Reporter._explainStdoutParsing(testResult, request)
  }

  static _explainUnknownReason (testResult, request) {
    log(request, 'Unknown reason..')
  }

  _explainInDetails (testResult) {
    if (testResult.passed || !this.request.conf.debug) {
      return
    }

    var errorReason = {
      NonZeroExitCode: this._explainNonZeroCode,
      OutputParsingError: Reporter._explainStdoutParsing,
      BadRequest: this._explainBadRequest,
      ExecutionTimeout: Reporter._explainTimeoutError,
      ConformToSchemaError: Reporter._explainConformingToSchema
    }[testResult.reason.message]

    if (!errorReason) {
      errorReason = Reporter._explainUnknownReason
    }

    var divider = '='.repeat(20)
    log(this.request, divider + ' Test: ' + testResult.sample.name + ' ' + divider)
    log(this.request, 'Path: ' + testResult.sample.path)
    log(this.request, 'Method: ' + testResult.sample.httpMethod)
    log(this.request, 'Duration: ' + (testResult.duration / 1000).toFixed(1))

    if (!testResult.passed) {
      errorReason(testResult, this.request)
    }

    if (testResult.passed && this.request.conf.debug) {
      Reporter._printStdoutAndStderr(testResult, this.request)
    }

    Reporter._printSampleSourceCode(testResult, this.request)
    log(this.request, '')
  }

  static showShortTestStatus (testResult, request) {
    if (testResult.passed) {
      logGreen(request, '[PASSED]')
    } else if (testResult.ignored()) {
      logYellow(request, '[IGNORE]')
    } else {
      logRed(request, '[FAILED]')
    }
  }

  printTestSessionReport (testResults) {
    var passedCount = 0
    var failedCount = 0
    var ignoredCount = 0
    var overallTime = 0.0
    var logFn = logGreen

    log(this.request, '')

    for (var testResultIndex in testResults) {
      var testResult = testResults[testResultIndex]

      overallTime += testResult.duration
      if (testResult.passed) {
        passedCount += 1
      } else if (testResult.ignored()) {
        ignoredCount += 1
        logFn = logYellow
      } else {
        failedCount += 1
        logFn = logRed
      }

      this._explainInDetails(testResult)
    }

    if (ignoredCount) {
      log(this.request, '== List of ignored tests ==')

      for (testResultIndex in testResults) {
        testResult = testResults[testResultIndex]

        if (testResult.ignored()) {
          log(this.request, testResult.sample.language() + ' - ' + testResult.sample.name + ' - ' + testResult.sample.httpMethod)
        }
      }
    }

    var conclusion = 'Test session passed'
    if (failedCount) {
      conclusion = 'Test session failed'
      log(this.request, '== List of failed tests ==')

      for (testResultIndex in testResults) {
        testResult = testResults[testResultIndex]
        if (testResult.failed()) {
          log(this.request, testResult.sample.language() + ' - ' + testResult.sample.name + ' - ' + testResult.sample.httpMethod)
        }
      }
    }
    overallTime /= 1000
    this.request.validationTime = (this.request.validationTime + overallTime).toString() + 's'
    if (!info.commandLine) {
      mongoDBManager.updateOne('Generation', this.request.id, { validationTime: this.request.validationTime })
    }

    log(this.request, 'Time spent: ' + overallTime.toFixed(1) + 's')

    var description = testResults.length + ' total, ' + passedCount + ' passed, ' + failedCount + ' failed, ' + ignoredCount + ' ignored'
    logFn(this.request, '\n== ' + conclusion + ' ==\n' + description)
  }

  static showLanguageScopeRun (language, request) {
    var prettyName = {
      'unirest.node': 'JavaScript',
      python: 'Python',
      curl: 'cURL',
      java: 'Java'
    }

    log(request, '======== ' + prettyName[language] + ' ========')
  }

  static showTestIsRunning (sample, request) {
    var message = sample.httpMethod + ': ' + sample.name
    var messageSpaces = sample.httpMethod.length < 6 ? ' '.repeat(6 - sample.httpMethod.length) : ''
    var terminalWidth = 200 // process.stdout.columns
    var spaces = 2
    var statusLen = 8
    var dotsCount = terminalWidth - message.length - spaces - statusLen - (6 - sample.httpMethod.length) - 100 // -100 is added for the interface terminal
    var dots = (dotsCount > 0) ? '.'.repeat(dotsCount) : ''

    log(request, messageSpaces + message + ' ' + dots + ' ', true)
  }
}

module.exports = {
  Reporter,
  debug,
  log
}
