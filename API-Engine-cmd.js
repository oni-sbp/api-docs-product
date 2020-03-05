const requestInfo = require('./RequestInfo')
const info = require('./info')
const codeGenerator = require('./generation/code-generator')
const runShellCommand = require('./validation/utils').runShellCommand
const args = require('minimist')(process.argv.slice(2))
const validator = require('./validation/code-validator')
const shelljs = require('shelljs')
const Config = require('./conf/conf').Config

info.commandLine = true

args.input = absolute(process.cwd().replace(/\\/g, '/'), args.input)

requestInfo.createRequest().then((request) => {
  request.createRequestFolder()
  request.saveInfoFromArgs(args)
  request.setLanguages()

  request.conf = new Config()
  if (args.config) {
    request.conf.loadConfigFile(request, args.config)
  }

  codeGenerator.generateSamples(request).then(() => {
    codeGenerator.generateDocs(request)

    shelljs.mkdir('-p', request.pathToDocs)
    if (info.onWindows) {
      runShellCommand('XCOPY /E "' + request.getDocsBuild() + '" "' + request.pathToDocs + '"', 20, process.cwd())
    } else {
      runShellCommand('cp -r "' + request.getDocsBuild() + '" "' + request.pathToDocs + '"', 20, process.cwd())
    }

    validator.validateGeneratedSamples(request)
  })
})

function absolute (base, relative) {
  var stack = base.split('/')
  var parts = relative.split('/')

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '.') { continue }
    if (parts[i] === '..') { stack.pop() } else { stack.push(parts[i]) }
  }
  return stack.join('/')
}
