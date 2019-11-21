const loader = require('./loader')
const Config = require('../conf/conf').Config
const TestSession = require('./session').TestSession
const info = require('../info')
const pathLib = require('path')
const utils = require('../utils')

async function validateGeneratedSamples (fields, files) {
  if (fields.validate !== 'on') {
    return 0
  }

  var samplesPath = await makeValidationConfigurations(fields, files)

  var samples = loader.loadCodeSamples(samplesPath, fields.keyword)
  var testSession = new TestSession(samples)
  var failedTestsCount = await testSession.run()

  return failedTestsCount
}

async function makeValidationConfigurations (fields, files) {
  info.setLanguages(fields)

  if (fields.authentication !== 'None') {
    if (fields.authentication === 'basic') {
      info.authentication = 'Basic'
    } else if (fields.authentication === 'bearer') {
      info.authentication = 'Bearer'
    }
  } else {
    info.authentication = 'None'
  }
  info.env.AUTH_TOKEN = fields.auth_token

  if (fields.host !== '') {
    info.env.TESTING_API_URL = fields.host
  }

  var configFile = await utils.getConfigFile(fields, files)
  info.conf = new Config()
  info.conf.loadConfigFile(configFile)

  var samplesPath = fields.samplespath
  if (!samplesPath.endsWith(pathLib.sep)) {
    samplesPath += pathLib.sep
  }

  return samplesPath
}

module.exports = {
  validateGeneratedSamples
}
