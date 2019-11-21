const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const info = require('../info')
const rewire = require('rewire')
const openapiParser = rewire('./openapi-parser')
const _ = require('underscore')
const Config = require('../conf/conf').Config

var reverts = []

describe('test generation/openapi-parser.js', function () {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test get2xxResponse', () => {
    var operation = {
      responses: {
        400: {},
        200: {}
      }
    }

    var getExampleStub = sinon.stub()
    getExampleStub.returns(null)

    var privateGet2xxResponse = openapiParser.__get__('get2xxResponse')
    var revertGetExample = openapiParser.__set__('getExample', getExampleStub)
    var ok = privateGet2xxResponse(operation)
    expect(_.isEqual(ok, { status: '200', body: '' })).to.equal(true)

    operation = {
      responses: {
        200: {},
        201: {}
      }
    }

    var getExampleStub2 = sinon.stub()
    getExampleStub2.onCall(0).returns(null)
    getExampleStub2.onCall(1).returns('example')
    revertGetExample()
    revertGetExample = openapiParser.__set__('getExample', getExampleStub2)

    ok = privateGet2xxResponse(operation)
    expect(_.isEqual(ok, { status: '201', body: 'example' })).to.equal(true)

    revertGetExample()
  })

  it('test getQueryString', () => {
    var operation1 = {
      parameters: {
        id: {
          in: 'header'
        }
      }
    }

    var getExampleStub = sinon.stub()
    getExampleStub.returns('example')

    var privateGetQueryString = openapiParser.__get__('getQueryString')
    var revertGetExample = openapiParser.__set__('getExample', getExampleStub)
    var queryString = privateGetQueryString(operation1)
    expect(queryString).to.equal(null)

    var operation2 = {
      parameters: {
        id: {
          in: 'header'
        },
        name: {
          in: 'query',
          name: 'name'
        },
        age: {
          in: 'query',
          name: 'age'
        }
      }
    }

    queryString = privateGetQueryString(operation2)
    expect(queryString).to.equal('name=example&age=example')

    revertGetExample()
  })

  it('test getBody', () => {
    var operation1 = {
      requestBody: {
      }
    }

    info.conf = new Config()

    var getExampleStub1 = sinon.stub()
    getExampleStub1.returns(null)
    var revertGetExample = openapiParser.__set__('getExample', getExampleStub1)
    var privateGetBody = openapiParser.__get__('getBody')
    var body = privateGetBody(operation1)
    expect(body).to.equal('{}')

    var getExampleStub2 = sinon.stub()
    getExampleStub2.returns('example')
    revertGetExample()
    revertGetExample = openapiParser.__set__('getExample', getExampleStub2)

    body = privateGetBody(operation1)
    expect(body).to.equal(JSON.stringify('example'))

    var operation2 = {
      parameters: {
        id: {
          in: 'header'
        },
        name: {
          in: 'body',
          name: 'name'
        },
        age: {
          in: 'body',
          name: 'age'
        }
      }
    }

    body = privateGetBody(operation2)
    expect(body).to.equal(JSON.stringify('example'))

    revertGetExample()
  })

  describe('test setHeaders', () => {
    afterEach(function () {
      for (var revert in reverts) {
        reverts[revert]()
      }
    })

    it('test that it sets all headers', () => {
      var operation = {
        parameters: {
          id: {
            in: 'header',
            name: 'id'
          },
          name: {
            in: 'header',
            name: 'name'
          },
          id1: {
            in: 'body',
            name: 'id'
          }
        }
      }

      var params = {
      }
      info.authentication = 'None'

      var getExampleStub = sinon.stub()
      getExampleStub.onFirstCall().returns(null)
        .onSecondCall().returns('example')

      var revertGetExample = openapiParser.__set__('getExample', getExampleStub)

      var privateSetHeaders = openapiParser.__get__('setHeaders')
      privateSetHeaders(operation, '', params)

      expect(params.headers).to.equal(JSON.stringify({ id: null, name: 'example' }, null, 4))

      revertGetExample()
    })

    it('test that it adds Content-Type', () => {
      var contentType = 'application/json'
      info.authentication = 'None'

      var privateSetHeaders = openapiParser.__get__('setHeaders')

      var params1 = {}
      privateSetHeaders({}, contentType, params1)
      expect(params1.headers).to.equal(undefined)

      var params2 = { body: 'body' }
      privateSetHeaders({}, contentType, params2)
      expect(params2.headers).to.equal(JSON.stringify({ 'Content-Type': 'application/json' }, null, 4))
    })

    it('test that it adds Authorization', () => {
      info.authentication = 'Bearer'
      var contentType = 'application/json'

      var privateSetHeaders = openapiParser.__get__('setHeaders')

      var params = {}
      privateSetHeaders({}, contentType, params)
      expect(params.headers).to.equal(JSON.stringify({ Authorization: 'Bearer <ACCESS_TOKEN>' }, null, 4))
    })
  })

  it('test getExample', () => {
    var privateGetExample = openapiParser.__get__('getExample')

    var parameter1 = {
      example: {
        example: 'example'
      }
    }
    var parameter2 = {
      examples: {
        example: {
          value: {
            example: 'example'
          }
        }
      }
    }
    var parameter3 = {
      examples: {
        example: {
          example: 'example'
        }
      }
    }
    var parameter4 = {
      schema: {
        examples: {
          example: {
            value: {
              example: 'example'
            }
          }
        }
      }
    }
    var parameter5 = {
      schema: {
        properties: {
          example1: {
            example: {
              example: 'example'
            }
          },
          example2: {
            examples: {
              example: {
                example: 'example'
              }
            }
          },
          example3: {
            examplee: {
              example: 'example'
            }
          }
        }
      }
    }
    var parameter6 = {
      content: {
        type: {
          schema: {
            examples: {
              example: {
                value: {
                  example: 'example'
                }
              }
            }
          }
        }
      }
    }

    var example1 = privateGetExample(parameter1)
    var example2 = privateGetExample(parameter2)
    var example3 = privateGetExample(parameter3)
    var example4 = privateGetExample(parameter4)
    var example5 = privateGetExample(parameter5)
    var example6 = privateGetExample(parameter6)

    expect(_.isEqual(example1, JSON.stringify({ example: 'example' }))).to.equal(true)
    expect(_.isEqual(example2, JSON.stringify({ example: 'example' }))).to.equal(true)
    expect(_.isEqual(example3, JSON.stringify({ example: 'example' }))).to.equal(true)
    expect(_.isEqual(example4, JSON.stringify({ example: 'example' }))).to.equal(true)
    expect(_.isEqual(example5, JSON.stringify({ example1: { example: 'example' }, example2: { example: 'example' } }))).to.equal(true)
    expect(_.isEqual(example6, JSON.stringify({ example: 'example' }))).to.equal(true)
  })

  it('test parse', (done) => {
    var api = {
      consumes: [
        'application/json'
      ],
      paths: {
        '/products/{version}/{product_code}': {
          get: {
            description: 'Desc1'
          }
        },
        '/products/{version}': {
          post: {
            description: 'Desc2'
          },
          get: {
            description: 'Desc3'
          }
        }
      }
    }

    var stubGet2xxResponse = function (operation) {
      return {}
    }
    var stubGetQueryString = function (operation) {
      return 'queryString'
    }
    var stubGetDebug = function (api, debug) {
    }

    var stubGetBody = sinon.stub()
    stubGetBody.onCall(0).returns({ body: 'body' })
    stubGetBody.onCall(1).returns(null)
    stubGetBody.onCall(2).returns(null)

    var stubSetHeaders = function (operation, contentType, params) {
      params.headers = 'headers'
    }
    var stubWrite = {
      writeExampleFiles (params, examplesPath, rootDirectory) {
        expect(_.isEqual(params, expectedParams[spy.callCount - 1])).to.equal(true)
      },
      writeDebug (a, b, c) {
      }
    }
    var stubSwaggerParser = {
      dereference: function (path) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve(api)
          }, 10)
        })
      }
    }
    var stubRamlParser = {
      setCurl (params) {
        params.curl = 'curl'
      }
    }
    var stubReporter = {
      debug: function (message) {},
      log: function (message) {}
    }

    var spy = sinon.spy(stubWrite, 'writeExampleFiles')

    reverts = []
    reverts.push(openapiParser.__set__('SwaggerParser', stubSwaggerParser))
    reverts.push(openapiParser.__set__('write', stubWrite))
    reverts.push(openapiParser.__set__('get2xxResponse', stubGet2xxResponse))
    reverts.push(openapiParser.__set__('getQueryString', stubGetQueryString))
    reverts.push(openapiParser.__set__('getBody', stubGetBody))
    reverts.push(openapiParser.__set__('setHeaders', stubSetHeaders))
    reverts.push(openapiParser.__set__('ramlParser', stubRamlParser))
    reverts.push(openapiParser.__set__('getDebug', stubGetDebug))
    reverts.push(openapiParser.__set__('reporter', stubReporter))

    info.languages = ['python', 'unirest.node', 'curl']

    var params = { server_name: 'server' }
    var expectedParams = [
      {
        server_name: 'server',
        uri: '/products/{version}/{product_code}',
        desc: 'Desc1',
        ok: {},
        request_method: 'get',
        query_string: 'queryString',
        body: {
          body: 'body'
        },
        headers: 'headers',
        curl: 'curl'
      },
      {
        server_name: 'server',
        uri: '/products/{version}',
        desc: 'Desc2',
        ok: {},
        request_method: 'post',
        query_string: 'queryString',
        body: null,
        headers: 'headers',
        curl: 'curl'
      },
      {
        server_name: 'server',
        uri: '/products/{version}',
        desc: 'Desc3',
        ok: {},
        request_method: 'get',
        query_string: 'queryString',
        body: null,
        headers: 'headers',
        curl: 'curl'
      }
    ]

    openapiParser.parse('./', './', './', params).then(() => {
      expect(spy.callCount).to.equal(3)
      done()
    })
  })
})
