const expect = require('chai').expect
const sinon = require('sinon')
const info = require('../../info')
const rewire = require('rewire')
const nodeRunner = rewire('./js')
const _ = require('underscore')
const errors = require('../errors')
const Config = require('../../conf/conf').Config
var reverts = []

function getNodeRunner () {
  var debugStub = function (msg) {
  }

  info.conf = new Config()
  info.conf.always_create_environments = true
  info.conf.virtualenv_creation_timeout = 10

  var reverts = []
  reverts.push(nodeRunner.__set__('debug', debugStub))

  var runner = new nodeRunner.NodeRunner()

  for (var revert in reverts) {
    reverts[revert]()
  }

  return runner
}

describe('test validation/runners/js.js', () => {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test _installNodeModulesIfNeeded', () => {
    var fsStub = {
      removeSync (path) {
      },
      existsSync (path) {
        return (spyExistsSync.callCount % 2 === 1)
      },
      mkdirSync (path) {
      }
    }
    var consoleStub = function (string) {}
    var utilsStub = {
      runShellCommand (command, timeout, cwd) {
      }
    }

    var spyRemoveSync = sinon.spy(fsStub, 'removeSync')
    var spyExistsSync = sinon.spy(fsStub, 'existsSync')
    var spyMkdir = sinon.spy(fsStub, 'mkdirSync')
    var spyRunShellCommand = sinon.spy(utilsStub, 'runShellCommand')

    info.conf = new Config()
    info.conf.always_create_environments = true
    info.conf.virtualenv_creation_timeout = 100000

    reverts = []
    reverts.push(nodeRunner.__set__('debug', consoleStub))
    reverts.push(nodeRunner.__set__('fs', fsStub))
    reverts.push(nodeRunner.__set__('utils', utilsStub))

    var runner = new nodeRunner.NodeRunner()

    expect(spyExistsSync.callCount).to.equal(2)
    expect(spyRemoveSync.callCount).to.equal(1)
    expect(spyMkdir.callCount).to.equal(1)
    expect(spyRunShellCommand.firstCall.args[0]).to.equal('npm install unirest')
    expect(spyRunShellCommand.firstCall.args[2]).to.equal(runner._projectDirPath)
  })

  describe('test _parseStdout', () => {
    it('test that it throws OutputParsingError', () => {
      var runner = getNodeRunner()

      var stdout1 = '{'
      expect(() => runner._parseStdout(stdout1)).to.throw(errors.OutputParsingError)

      var stdout2 = '{"code": 200, "raw_body": "}"}'
      expect(() => runner._parseStdout(stdout2)).to.throw(errors.OutputParsingError)
    }).timeout(10000)

    it('test that it throws ConformToSchemaError', () => {
      var runner = getNodeRunner()

      var stdout = '{"cod": 200, "raw_body": "{}}"}'
      expect(() => runner._parseStdout(stdout)).to.throw(errors.ConformToSchemaError)
    }).timeout(10000)

    it('test that it parses correctly', () => {
      var runner = getNodeRunner()

      var stdout = '{"code": 200, "raw_body": {}}'
      expect(() => runner._parseStdout(stdout)).to.not.throw()
      expect(_.isEqual(runner._parseStdout(stdout), { jsonBody: {}, statusCode: 200 })).to.equal(true)
    }).timeout(10000)
  })
})

module.exports = {
  getNodeRunner
}
