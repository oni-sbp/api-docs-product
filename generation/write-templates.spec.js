const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const info = require('../info')
const rewire = require('rewire')
const writeTemplates = rewire('./write-templates')
var reverts = []

describe('test generation/write-templates.js', function () {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test writeExampleFiles', () => {
    var params = {
      headers: JSON.stringify({
        Authorization: 'Bearer <ACCESS_TOKEN>',
        'Content-Type': 'application/json'
      }),
      body: '{\n   "subject" : "Go to the grocery store",\n   "content" : "Remember to buy milk!"\n}\n',
      scheme: 'https',
      server_name: 'api.oftrust.net',
      uri: '/messages/{version}/{id}',
      request_method: 'put',
      query_string: 'offset=200&limit=400'
    }

    var fsStub = {
      writeFileSync: function (path, content) {
      },
      existsSync: function (path) {
        return false
      },
      mkdirSync: function (path) {
      },
      readFileSync: function (path) {
        return ''
      }
    }

    var ejsStub = { render: function (a, b) { return '' } }
    var stubReporter = {
      debug: function (message) {},
      log: function (message) {}
    }

    var spy = sinon.spy(fsStub, 'writeFileSync')
    reverts = []
    reverts.push(writeTemplates.__set__('ejs', ejsStub))
    reverts.push(writeTemplates.__set__('fs', fsStub))
    reverts.push(writeTemplates.__set__('reporter', stubReporter))

    info.languages = ['python', 'unirest.node', 'curl']

    writeTemplates.writeExampleFiles(params, [], './', './')

    expect(spy.callCount === 3)
    expect(spy.firstCall.args[0]).to.equal('_messages_{version}_{id}/PUT/python.py')
    expect(spy.secondCall.args[0]).to.equal('_messages_{version}_{id}/PUT/unirest.node.js')
    expect(spy.thirdCall.args[0]).to.equal('_messages_{version}_{id}/PUT/curl')

    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test getTemplates', () => {
    var privateGetTemplates = writeTemplates.__get__('getTemplates')
    info.languages = ['python', 'unirest.node', 'curl']
    var templates = privateGetTemplates(process.cwd())

    for (var language in info.languages) {
      expect(templates).to.have.property(info.languages[language])
    }

    for (language in templates) {
      expect(info.languages.includes(language)).to.equal(true)
    }
  })
})
