const loader = require('./loader')
const TestSession = require('./session').TestSession
const pathLib = require('path')
const fs = require('fs')
const info = require('../info')
const mongoDBManager = require('../mongoDBManager')

async function validateGeneratedSamples (request) {
  request.logFileStream = fs.createWriteStream(request.getValidationLogFile(), { flags: 'w' })

  if (!info.commandLine) {
    mongoDBManager.updateOne('Generation', request.id, { stage: 4 })
  }

  const timerStart = Date.now()

  if (!request.validate) {
    request.validationTime = '0s'
    request.totalTests = 0
    request.failedTests = 0

    info.requestReady[request.id] = true

    if (!info.commandLine) {
      mongoDBManager.updateOne('Generation', request.id, { validationTime: request.validationTime, totalTests: request.totalTests, failedTests: request.failedTests })
    }

    return
  }

  var samplesPath = getSamplesPath(request)

  var samples = loader.loadCodeSamples(request, samplesPath, request.keyword)
  request.totalTests = samples.length

  var testSession = new TestSession(request, samples)
  const timerEnd = Date.now()
  request.validationTime = (timerEnd - timerStart) / 1000

  await testSession.run()

  info.stageReady[request.id] = true
}

function getSamplesPath (request) {
  var samplesPath = request.getGeneratedSamplesFolder()
  if (!samplesPath.endsWith(pathLib.sep)) {
    samplesPath += pathLib.sep
  }

  return samplesPath
}

module.exports = {
  validateGeneratedSamples
}
