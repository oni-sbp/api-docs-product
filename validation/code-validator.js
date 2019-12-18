const loader = require('./loader')
const Config = require('../conf/conf').Config
const TestSession = require('./session').TestSession
const pathLib = require('path')
const utils = require('../utils')

async function validateGeneratedSamples (fields, files, request) {
  const timerStart = Date.now()
  if (fields.validate !== 'on') {
    request.validationTime = '0s'
    request.totalTests = 0
    request.failedTests = 0

    return
  }

  var samplesPath = await makeValidationConfigurations(fields, files, request)

  var samples = loader.loadCodeSamples(request, samplesPath, fields.keyword)
  var testSession = new TestSession(request, samples)
  request.failedTests = await testSession.run()
  const timerEnd = Date.now()

  request.validationTime = ((timerEnd - timerStart) / 1000).toString() + 's'
  request.totalTests = samples.length
}

async function makeValidationConfigurations (fields, files, request) {
  request.setLanguages(fields)

  if (fields.authentication !== 'None') {
    if (fields.authentication === 'basic') {
      request.authentication = 'Basic'
    } else if (fields.authentication === 'bearer') {
      request.authentication = 'Bearer'
    }
  } else {
    request.authentication = 'None'
  }
  request.env.AUTH_TOKEN = fields.auth_token

  if (fields.host !== '') {
    request.env.TESTING_API_URL = fields.host
  }

  var configFile = await utils.getConfigFile(fields, files, request)
  request.conf = new Config()
  request.conf.loadConfigFile(request, configFile)

  var samplesPath = fields.samplespath
  if (!samplesPath.endsWith(pathLib.sep)) {
    samplesPath += pathLib.sep
  }

  return samplesPath
}

module.exports = {
  validateGeneratedSamples
}
