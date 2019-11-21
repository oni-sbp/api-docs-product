const expect = require('chai').expect
const sinon = require('sinon')
const Config = require('../../conf/conf').Config
const CodeRunner = require('./code').CodeRunner
const info = require('../../info')
const rewire = require('rewire')
const codeRunner = rewire('./code')
const _ = require('underscore')
const getPythonRunner = require('./python.spec').getPythonRunner
const getNodeRunner = require('./js.spec').getNodeRunner
const getCurlRunner = require('./curl.spec').getCurlRunner
const fs = require('fs')
const errors = require('../errors')
var reverts = []

function runnersFactory (language) {
  if (language === 'python') {
    return getPythonRunner()
  } else if (language === 'curl') {
    return getCurlRunner()
  } else if (language === 'unirest.node') {
    return getNodeRunner()
  }
}

describe('test validation/runners/code.js', () => {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test replaceKeywords', () => {
    info.conf = new Config()
    info.conf.substitutions = { '<aaaa>': 'bbbb' }
    var replace = CodeRunner.replaceKeywords

    expect(replace('{version}', { version: 'v1' })).to.equal('{v1}')
    expect(replace('{version}', { '{version}': 'v1' })).to.equal('v1')
    expect(replace('[{"a": "b"]', { '[{"a": "b"]': '[]' })).to.equal('[]')
    expect(replace('{<aaaa>}', { version: 'v1' })).to.equal('{bbbb}')
  })

  it('test getSubstitutionsFromDebugFile', () => {
    var sample = { path: 'aaa' }
    var substitutions = [
      { '<Product name>': 'Whiskey' },
      { '[{\\"key\\": \\"<VALUE>\\"}]': '[{\\"key\\":\\"rsa\\"}]' },
      { '<image URL>': 'http://ok' },
      { '[{"key":"<key type>"}]': '[{"key":"rsa"}]' }
    ]

    var samples = [
            `"{
                \\"productName\\": \\"<Product name>\\"
            "}`,
            `"{
                \\"keys\\": [{\\"key\\": \\"<VALUE>\\"}]
            "}`,
            'data=({"imageUrl":"<image URL>"})',
            'data=({"keys": [{"key":"<key type>"}]})'
    ]

    var debug = [
      { productName: 'Whiskey' },
      { keys: [{ key: 'rsa' }] },
      { imageUrl: 'http://ok' },
      { keys: [{ key: 'rsa' }] }
    ]

    var stubFs = {
      readFileSync (path, b) {
        if (path === 'aaa') {
          return samples[Math.floor((spy.callCount - 1) / 2)]
        } else {
          return JSON.stringify(debug[Math.floor((spy.callCount - 1) / 2)])
        }
      }
    }

    var spy = sinon.spy(stubFs, 'readFileSync')

    reverts = []
    reverts.push(codeRunner.__set__('fs', stubFs))

    for (var i = 0; i < 4; i++) {
      expect(_.isEqual(codeRunner.CodeRunner.getSubstitutionsFromDebugFile(sample), substitutions[i])).to.equal(true)
    }
  })

  it('test prepareSample', () => {
    var substitutions = { '<AUTH_TOKEN>': '"Token"' }
    var testFilePath = 'validation/runners/testFiles/testPrepareSample.txt'
    fs.readFileSync(testFilePath, 'utf8')

    for (var languageIndex in info.acceptedValidationLanguages) {
      var language = info.acceptedValidationLanguages[languageIndex]

      var runner = runnersFactory(language)
      var tmpFile = runner.prepareSample(testFilePath, substitutions)
      expect(fs.readFileSync(tmpFile, 'utf8')).to.equal('lib.get("url", token="Token")')
    }
  }).timeout(30000)

  describe('test runSample', () => {
    it('test non zero exit code', () => {
      var getSubstitutionsFromDebugFileCopy = CodeRunner.getSubstitutionsFromDebugFile
      CodeRunner.getSubstitutionsFromDebugFile = function () { return {} }
      var sample = { path: '' }
      var testFilePath = 'validation/runners/testFiles/testRunSample.txt'

      for (var languageIndex in info.acceptedValidationLanguages) {
        var language = info.acceptedValidationLanguages[languageIndex]

        var runner = runnersFactory(language)

        fs.writeFileSync(testFilePath, '')
        runner.prepareSample = function (a, b) { return testFilePath }
        runner._runSample = function (a) { return { exitCode: 1 } }

        var result = runner.runSample(sample, {})

        expect(result.passed).to.equal(false)
        expect(result.reason).to.equal(errors.NonZeroExitCode)
      }

      CodeRunner.getSubstitutionsFromDebugFile = getSubstitutionsFromDebugFileCopy
    }).timeout(30000)

    it('test bad request', () => {
      var getSubstitutionsFromDebugFileCopy = CodeRunner.getSubstitutionsFromDebugFile
      CodeRunner.getSubstitutionsFromDebugFile = function () { return {} }
      var sample = { path: '' }
      var testFilePath = 'validation/runners/testFiles/testRunSample.txt'

      for (var languageIndex in info.acceptedValidationLanguages) {
        var language = info.acceptedValidationLanguages[languageIndex]

        var runner = runnersFactory(language)

        fs.writeFileSync(testFilePath, '')
        runner.prepareSample = function (a, b) { return testFilePath }
        runner._runSample = function (a) { return { exitCode: 0 } }
        runner._parseStdout = function (a) { return { jsonBody: {}, statusCode: 422 } }

        var result = runner.runSample(sample, {})

        expect(result.passed).to.equal(false)
        expect(result.reason).to.equal(errors.BadRequest)
      }

      CodeRunner.getSubstitutionsFromDebugFile = getSubstitutionsFromDebugFileCopy
    }).timeout(30000)
  })
})
