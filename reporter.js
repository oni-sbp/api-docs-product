const color = require('node-colorify')
const info = require('./info')

function debug (message) {
  console.log(color.colorItSync(message, { fColor: 'blue' }))
  info.logFileStream.write(message + '\n')
}

function log (message, noNewLine = false) {
  console.log(message.toString())
  if (!noNewLine) {
    message += '\n'
  }
  info.logFileStream.write(message.toString())
}

function logRed (message) {
  console.log(color.colorItSync(message, { fColor: 'red' }))
  info.logFileStream.write(message + '\n')
}

function logGreen (message) {
  console.log(color.colorItSync(message, { fColor: 'green' }))
  info.logFileStream.write(message + '\n')
}

function logYellow (message) {
  console.log(color.colorItSync(message, { fColor: 'yellow' }))
  info.logFileStream.write(message + '\n')
}

class Reporter {
  _explainNonZeroCode (testResult) {
    if (!testResult.cmdResult) {
      return
    }

    var code = testResult.cmdResult.exitCode
    log('Command returned non-zero exit code: ' + code)
    Reporter._printStdoutAndStderr(testResult)
  }

  static _explainStdoutParsing (testResult) {
    if (!testResult.cmdResult) {
      return
    }

    var stdout = testResult.cmdResult.stdout
    var stderr = testResult.cmdResult.stderr

    if (stdout.trim()) {
      log('Incorrect sample output:\n' + stdout)
    } else {
      log('No stdout captured')

      if (stderr) {
        log('STDERR:\n' + stderr)
      }
    }
  }

  static _printStdoutAndStderr (testResult) {
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

    log(stdoutDesc + '\n' + stderrDesc)
  }

  _explainBadRequest (testResult) {
    log('Bad request: ' + testResult.statusCode)
    Reporter._printStdoutAndStderr(testResult)
  }

  static _explainTimeoutError (testResult) {
    log('Timeout error: ' + info.conf.sample_timeout + 's')
  }

  static _printSampleSourceCode (testResult) {
    var code = testResult.sourceCode
    log('Sample source code (with substitutions):\n' + code)
  }

  static _explainConformingToSchema (testResult) {
    if (['python', 'unirest.node'].includes(testResult.sample.language())) {
      log('Resulted JSON must contain "raw_body" and "code" fields')
    }

    Reporter._explainStdoutParsing(testResult)
  }

  static _explainUnknownReason (testResult) {
    log('Unknown reason..')
  }

  _explainInDetails (testResult) {
    if (testResult.passed && !info.conf.debug) {
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
    log(divider + ' Test: ' + testResult.sample.name + ' ' + divider)
    log('Path: ' + testResult.sample.path)
    log('Method: ' + testResult.sample.httpMethod)
    log('Duration: ' + (testResult.duration / 1000).toFixed(1))

    if (!testResult.passed) {
      errorReason(testResult)
    }

    if (testResult.passed && info.conf.debug) {
      Reporter._printStdoutAndStderr(testResult)
    }

    Reporter._printSampleSourceCode(testResult)
    log('')
  }

  static showShortTestStatus (testResult) {
    if (testResult.passed) {
      logGreen('[PASSED]')
    } else if (testResult.ignored()) {
      logYellow('[IGNORE]')
    } else {
      logRed('[FAILED]')
    }
  }

  printTestSessionReport (testResults) {
    var passedCount = 0
    var failedCount = 0
    var ignoredCount = 0
    var overallTime = 0.0
    var logFn = logGreen

    log('')

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
      log('== List of ignored tests ==')

      for (testResultIndex in testResults) {
        testResult = testResults[testResultIndex]

        if (testResult.ignored()) {
          log(testResult.sample.language() + ' - ' + testResult.sample.name + ' - ' + testResult.sample.httpMethod)
        }
      }
    }

    var conclusion = 'Test session passed'
    if (failedCount) {
      conclusion = 'Test session failed'
      log('== List of failed tests ==')

      for (testResultIndex in testResults) {
        testResult = testResults[testResultIndex]
        if (testResult.failed()) {
          log(testResult.sample.language() + ' - ' + testResult.sample.name + ' - ' + testResult.sample.httpMethod)
        }
      }
    }
    overallTime /= 1000
    log('Time spent: ' + overallTime.toFixed(1) + 's')
    var description = testResults.length + ' total, ' + passedCount + ' passed, ' + failedCount + ' failed, ' + ignoredCount + ' ignored'

    logFn('\n== ' + conclusion + ' ==\n' + description)
  }

  static showLanguageScopeRun (language) {
    var prettyName = {
      'unirest.node': 'JavaScript',
      python: 'Python',
      curl: 'cURL'
    }

    log('======== ' + prettyName[language] + ' ========')
  }

  static showTestIsRunning (sample) {
    var message = sample.httpMethod + ': ' + sample.name
    var messageSpaces = sample.httpMethod.length < 6 ? ' '.repeat(6 - sample.httpMethod.length) : ''
    var terminalWidth = process.stdout.columns
    var spaces = 2
    var statusLen = 8
    var dotsCount = terminalWidth - message.length - spaces - statusLen - (6 - sample.httpMethod.length)
    var dots = (dotsCount > 0) ? '.'.repeat(dotsCount) : ''

    log(messageSpaces + message + ' ' + dots + ' ', true)
  }
}

module.exports = {
  Reporter,
  debug,
  log
}
