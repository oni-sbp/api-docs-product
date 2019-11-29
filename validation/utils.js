const errors = require('./errors.js')
const { execSync } = require('child_process')
const SystemCmdResult = require('./validation-classes').SystemCmdResult
const info = require('../info')

function runShellCommand (args, timeout = null, cwd = null) {
  timeout = timeout || info.conf.sample_timeout

  var exitCode = 0
  var stdout = ''
  var stderr = ''
	console.log(args, cwd)
  try {
    stdout = execSync(args, { timeout: timeout * 1000, cwd: cwd, stdio: 'pipe' }, (error, stdout, stderr) => {
      if (error) {
        console.log(error)
      }
    })
  } catch (error) {
    if (error.signal === 'SIGTERM') {
      throw errors.ExecutionTimeout
    }

    exitCode = error.status
    stderr = error.stderr.toString()
  }
	console.log(stdout.toString())

  return new SystemCmdResult(exitCode, stdout.toString(), stderr)
}

module.exports = {
  runShellCommand
}
