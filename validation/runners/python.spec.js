const expect = require('chai').expect
const info = require('../../info')
const rewire = require('rewire')
const pythonRunner = rewire('./python')
const _ = require('underscore')
const errors = require('../errors')
const Config = require('../../conf/conf').Config

function getPythonRunner () {
  var debugStub = function (msg) {
  }

  info.conf = new Config()
  info.conf.always_create_environments = true
  info.conf.virtualenv_creation_timeout = 100000

  var reverts = []
  reverts.push(pythonRunner.__set__('debug', debugStub))

  var runner = new pythonRunner.PythonRunner()

  for (var revert in reverts) {
    reverts[revert]()
  }

  return runner
}

describe('test validation/runners/python.js', () => {
  describe('test _parseStdout', () => {
    it('test that it throws OutputParsingError', () => {
      var runner = getPythonRunner()

      var stdout1 = '{'
      expect(() => runner._parseStdout(stdout1)).to.throw(errors.OutputParsingError)

      var stdout2 = '{"code": 200, "raw_body": "}"}'
      expect(() => runner._parseStdout(stdout2)).to.throw(errors.OutputParsingError)
    }).timeout(10000)

    it('test that it throws ConformToSchemaError', () => {
      var runner = getPythonRunner()

      var stdout = '{"cod": 200, "raw_body": "{}}"}'
      expect(() => runner._parseStdout(stdout)).to.throw(errors.ConformToSchemaError)
    }).timeout(10000)

    it('test that it parses correctly python single quotes json load', () => {
      var runner = getPythonRunner()

      var stdout = "{'code': 200, 'raw_body': {}}"
      expect(() => runner._parseStdout(stdout)).to.not.throw()
      expect(_.isEqual(runner._parseStdout(stdout), { jsonBody: {}, statusCode: 200 })).to.equal(true)
    }).timeout(10000)
  })
})

module.exports = {
  getPythonRunner
}
