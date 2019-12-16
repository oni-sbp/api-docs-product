const errors = require('./errors.js')
const { execSync } = require('child_process')
const SystemCmdResult = require('./validation-classes').SystemCmdResult

function runShellCommand (args, timeout = null, cwd = null) {
  timeout = timeout || 20

  var exitCode = 0
  var stdout = ''
  var stderr = ''

  try {
    stdout = execSync(args, { timeout: timeout * 1000, cwd: cwd, stdio: 'pipe' }, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
      }
    })
  } catch (error) {
    console.log(error)
    if (error.signal === 'SIGTERM') {
      throw errors.ExecutionTimeout
    }

    exitCode = error.status
    stderr = error.stderr.toString()
  }

  return new SystemCmdResult(exitCode, stdout.toString(), stderr)
}

module.exports = {
  runShellCommand
}
