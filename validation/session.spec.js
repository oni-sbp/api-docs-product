const expect = require('chai').expect
const info = require('../info')
const rewire = require('rewire')
const tempDirectory = require('temp-dir')
const pathLib = require('path')
const fs = require('fs-extra')
const tempFilesFactory = require('./test-utils').tempFilesFactory
const loader = require('./loader')
const CurlRunner = require('./runners/curl').CurlRunner
const Config = require('../conf/conf').Config
const testSession = rewire('./session')

var reverts = []

describe('test validation/validation-classes.js', () => {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test reusing response from prev requests with replacements', (done) => {
    var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
    if (fs.existsSync(tmpFolder)) {
      fs.removeSync(tmpFolder)
    }
    fs.mkdirSync(tmpFolder)

    tempFilesFactory(tmpFolder, [
      'api/user/POST/curl',
      'api/user/{id}/GET/curl'
    ])
    info.setLanguages({ curl: 'on' })

    var samples = loader.loadCodeSamples(tmpFolder)

    expect(samples[1].httpMethod === 'GET')

    class stubNodeRunner { };
    class stubPythonRunner { };
    class stubCurlRunner { };
    class stubReporter {
      debug (message) { }
      log (message) { }
      printTestSessionReport (results) { }
      static showLanguageScopeRun (lang) { }
      static showTestIsRunning (sample) { }
      static showShortTestStatus (testResult) { }
    };

    reverts = []
    reverts.push(testSession.__set__('NodeRunner', stubNodeRunner))
    reverts.push(testSession.__set__('PythonRunner', stubPythonRunner))
    reverts.push(testSession.__set__('CurlRunner', stubCurlRunner))
    reverts.push(testSession.__set__('Reporter', stubReporter))

    info.conf = new Config()
    info.conf.resp_attr_replacements = { 'api/user': [{ '@id': 'id' }] }

    var curlRunner = new CurlRunner()
    curlRunner._parseStdout = function (a) {
      return { jsonBody: { '@id': 1 }, statusCode: 200 }
    }
    curlRunner._cleanup = function () { }
    curlRunner._runSample = function (a) {
      return { exitCode: 0 }
    }

    var session = new testSession.TestSession(samples)
    session.runners.curl = curlRunner

    var originalSourceCode = 'curl website/api/user/{id}'
    var expectedSourceCode = 'curl website/api/user/1'
    fs.writeFileSync(samples[1].path, originalSourceCode)

    session.run().then(() => {
      var actualCode = fs.readFileSync(session.runners.curl.tmpSamplePath, 'utf8')
      expect(actualCode).to.equal(expectedSourceCode)

      fs.removeSync(tmpFolder)

      done()
    })
  })

  it('test reusing response from prev requests nested', (done) => {
    var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
    if (fs.existsSync(tmpFolder)) {
      fs.removeSync(tmpFolder)
    }
    fs.mkdirSync(tmpFolder)

    tempFilesFactory(tmpFolder, [
      'api/users/POST/curl',
      'api/users/{from}/link/{to}/POST/curl',
      'api/users/{from}/link/{to}/{type}/GET/curl'
    ])
    info.setLanguages({ curl: 'on' })

    var samples = loader.loadCodeSamples(tmpFolder)

    class stubNodeRunner { };
    class stubPythonRunner { };
    class stubCurlRunner { };
    class stubReporter {
      debug (message) { }
      log (message) { }
      printTestSessionReport (results) { }
      static showLanguageScopeRun (lang) { }
      static showTestIsRunning (sample) { }
      static showShortTestStatus (testResult) { }
    };

    reverts = []
    reverts.push(testSession.__set__('NodeRunner', stubNodeRunner))
    reverts.push(testSession.__set__('PythonRunner', stubPythonRunner))
    reverts.push(testSession.__set__('CurlRunner', stubCurlRunner))
    reverts.push(testSession.__set__('Reporter', stubReporter))

    info.conf = new Config()
    info.conf.resp_attr_replacements = { 'api/users': [{ id: 'from' }] }

    var curlRunner = new CurlRunner()
    var callNo = 0
    curlRunner._parseStdout = function (a) {
      var responses = [
        { jsonBody: { id: 'uuid' }, statusCode: 200 },
        { jsonBody: {}, statusCode: 200 },
        { jsonBody: {}, statusCode: 200 }]
      return responses[callNo++]
    }
    curlRunner._cleanup = function () { }
    curlRunner._runSample = function (a) {
      return { exitCode: 0 }
    }

    var session = new testSession.TestSession(samples)
    session.runners.curl = curlRunner

    var originalSourceCode = 'curl /users/{from}/link/{to}/{type}'
    var expectedSourceCode = 'curl /users/uuid/link/{to}/{type}'
    fs.writeFileSync(samples[2].path, originalSourceCode)

    session.run().then(() => {
      var actualCode = fs.readFileSync(session.runners.curl.tmpSamplePath, 'utf8')
      expect(actualCode).to.equal(expectedSourceCode)

      fs.removeSync(tmpFolder)

      done()
    })
  })

  it('test before_sample replacements', (done) => {
    var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
    if (fs.existsSync(tmpFolder)) {
      fs.removeSync(tmpFolder)
    }
    fs.mkdirSync(tmpFolder)

    tempFilesFactory(tmpFolder, [
      'api/users/POST/curl'
    ])
    info.setLanguages({ curl: 'on' })

    var sample = loader.loadCodeSamples(tmpFolder)[0]

    class StubNodeRunner { };
    class StubPythonRunner { };
    class StubCurlRunner { };
    class StubReporter {
      debug (message) { }
      log (message) { }
      printTestSessionReport (results) { }
      static showLanguageScopeRun (lang) { }
      static showTestIsRunning (sample) { }
      static showShortTestStatus (testResult) { }
    };
    class StubResourceRegistry {
      async create (a, b) {
        return { '<username>': 'John' }
      }

      async cleanup () { }
    }
    reverts = []
    reverts.push(testSession.__set__('NodeRunner', StubNodeRunner))
    reverts.push(testSession.__set__('PythonRunner', StubPythonRunner))
    reverts.push(testSession.__set__('CurlRunner', StubCurlRunner))
    reverts.push(testSession.__set__('Reporter', StubReporter))

    info.conf = new Config()
    info.conf.before_sample = {}
    info.conf.before_sample[sample.name] = [
      {
        resource: 'Identity',
        subs: { '@id': '<username>' },
        method: 'POST'
      }
    ]

    var curlRunner = new CurlRunner()
    curlRunner._parseStdout = function (a) {
      return { jsonBody: {}, statusCode: 200 }
    }
    curlRunner._cleanup = function () { }
    curlRunner._runSample = function (a) {
      return { exitCode: 0 }
    }

    var session = new testSession.TestSession([sample])
    session.runners.curl = curlRunner
    session._resourceRegistry = new StubResourceRegistry()

    var originalSourceCode = 'curl url --data {"name": "<username>"}'
    var expectedSourceCode = 'curl url --data {"name": "John"}'
    fs.writeFileSync(sample.path, originalSourceCode)

    session.run().then(() => {
      var actualCode = fs.readFileSync(session.runners.curl.tmpSamplePath, 'utf8')
      expect(actualCode).to.equal(expectedSourceCode)

      fs.removeSync(tmpFolder)

      done()
    })
  })

  it('test before_sample replacements nested path', (done) => {
    var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
    if (fs.existsSync(tmpFolder)) {
      fs.removeSync(tmpFolder)
    }
    fs.mkdirSync(tmpFolder)

    tempFilesFactory(tmpFolder, [
      'api/users/{id}/link/POST/curl',
      'api/users/{id}/link/linkID/GET/curl'
    ])
    info.setLanguages({ curl: 'on' })

    var samples = loader.loadCodeSamples(tmpFolder)

    class StubNodeRunner { };
    class StubPythonRunner { };
    class StubCurlRunner { };
    class StubReporter {
      debug (message) { }
      log (message) { }
      printTestSessionReport (results) { }
      static showLanguageScopeRun (lang) { }
      static showTestIsRunning (sample) { }
      static showShortTestStatus (testResult) { }
    };
    class StubResourceRegistry {
      async create (a, b) {
        return { id: 'John' }
      }

      async cleanup () { }
    }
    reverts = []
    reverts.push(testSession.__set__('NodeRunner', StubNodeRunner))
    reverts.push(testSession.__set__('PythonRunner', StubPythonRunner))
    reverts.push(testSession.__set__('CurlRunner', StubCurlRunner))
    reverts.push(testSession.__set__('Reporter', StubReporter))

    info.conf = new Config()
    info.conf.before_sample = {}
    info.conf.before_sample[samples[0].name] = [
      {
        resource: 'Identity',
        subs: { '@id': 'id' },
        method: 'POST'
      }
    ]

    var curlRunner = new CurlRunner()
    curlRunner._parseStdout = function (a) {
      return { jsonBody: { stub: 'data' }, statusCode: 200 }
    }
    curlRunner._cleanup = function () { }
    curlRunner._runSample = function (a) {
      return { exitCode: 0 }
    }

    var session = new testSession.TestSession(samples)
    session.runners.curl = curlRunner
    session._resourceRegistry = new StubResourceRegistry()

    var originalSourceCode = 'curl api/users/{id}/link/linkID'
    var expectedSourceCode = 'curl api/users/John/link/linkID'
    fs.writeFileSync(samples[1].path, originalSourceCode)

    session.run().then(() => {
      var actualCode = fs.readFileSync(session.runners.curl.tmpSamplePath, 'utf8')
      expect(actualCode).to.equal(expectedSourceCode)

      fs.removeSync(tmpFolder)

      done()
    })
  })
})
