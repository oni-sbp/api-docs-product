const expect = require('chai').expect
const sinon = require('sinon')
const info = require('../info')
const rewire = require('rewire')
const ramlParser = rewire('./raml-parser')
const _ = require('underscore')
var reverts = []

describe('test generation/raml-parser.js', function () {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test setHeaders', () => {
    var params = { body: { body: 'body' } }
    var contentType = 'application/json'
    var operation = {
      request: {
        headers: [
          {
            parameterName: {
              value () {
                return 'Authorization'
              }
            },
            schema: {
              examples: [
                {
                  toJson: JSON.stringify('Bearer <ACCESS_TOKEN>')
                }
              ]
            }
          }
        ]
      }
    }
    var privateSetHeaders = ramlParser.__get__('setHeaders')
    privateSetHeaders(operation, contentType, params)

    var expectedHeaders = { Authorization: 'Bearer <ACCESS_TOKEN>', 'Content-Type': 'application/json' }
    expect(params.headers).to.equal(JSON.stringify(expectedHeaders, null, 4))
  })

  it('test isJsonString', () => {
    var notJsonString = '{"body":{"body":"body"}'
    var jsonString = JSON.stringify({ body: { body: 'body' } })

    var privateIsJsonString = ramlParser.__get__('isJsonString')
    expect(privateIsJsonString(jsonString)).to.be.equal(true)
    expect(privateIsJsonString(notJsonString)).to.be.equal(false)
  })

  it('test getQueryString', () => {
    var operation = {
      request: {
        queryParameters: [
          {
            name: {
              value () {
                return 'offset'
              }
            },
            schema: {
              examples: [
                {
                  toJson: JSON.stringify('200')
                }
              ]
            }
          },
          {
            name: {
              value () {
                return 'limit'
              }
            },
            schema: {
              examples: [
                {
                  toJson: JSON.stringify('400')
                }
              ]
            }
          }

        ]
      }
    }

    var privateGetQueryString = ramlParser.__get__('getQueryString')

    expect(privateGetQueryString(operation)).to.equal('offset=200&limit=400')
  })

  it('test getBody', () => {
    var body = JSON.stringify({
      context: 'https://standards.lifeengine.io/v1/Context/Link/Role/MemberOf',
      type: 'MemberOf'
    })

    var operation = {
      request: {
        payloads: [
          {
            schema: {
              examples: [
                {}
              ]
            }
          },
          {
            schema: {
              examples: [
                {
                  toJson: body
                }
              ]
            }
          }
        ]
      }
    }

    var privateGetBody = ramlParser.__get__('getBody')

    expect(privateGetBody(operation)).to.equal(body)
  })

  it('test get2xxResponse', () => {
    var operation = {
      responses: [
        {
          payloads: [
            {
              schema: {
                examples: [
                  {
                    toJson: JSON.stringify({ a: 'b' })
                  }
                ]
              }
            }
          ],
          statusCode: {
            value () {
              return '404'
            }
          }
        },
        {
          payloads: [
            {
              schema: {
                examples: [
                  {
                    toJson: JSON.stringify({ a: 'b' })
                  }
                ]
              }
            }
          ],
          statusCode: {
            value () {
              return '200'
            }
          }
        }
      ]
    }

    var privateGet2xxResponse = ramlParser.__get__('get2xxResponse')
    var response = privateGet2xxResponse(operation)

    var expectedResponse = {
      status: '200',
      body: JSON.stringify({ a: 'b' })
    }

    expect(_.isEqual(response, expectedResponse)).to.equal(true)
  })

  it('test setCurl', () => {
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

    var privateSetCurl = ramlParser.__get__('setCurl')

    privateSetCurl(params)

    var expectedCurl = 'curl -i -X PUT \\\n   -H "Authorization: Bearer <ACCESS_TOKEN>" \\\n   -H "Content-Type: application/json" \\\n   -d \\\n"{\n   \\"subject\\" : \\"Go to the grocery store\\",\n   \\"content\\" : \\"Remember to buy milk!\\"\n}" "https://api.oftrust.net/messages/{version}/{id}?offset=200&limit=400"'
    expect(expectedCurl).to.equal(params.curl)
  })

  it('test parse', (done) => {
    var model = {
      encodes: {
        contentType: [
          {
            value: function () {
              return 'application/json'
            }
          }
        ],
        endPoints: [
          {
            path: {
              value: function () {
                return '/products/{version}/{product_code}'
              }
            },
            operations: [
              {
                description: {
                  value: function () {
                    return 'Desc1'
                  }
                },
                method: {
                  value: function () {
                    return 'get'
                  }
                }
              }
            ]
          },
          {
            path: {
              value: function () {
                return '/products/{version}'
              }
            },
            operations: [
              {
                description: {
                  value: function () {
                    return 'Desc2'
                  }
                },
                method: {
                  value: function () {
                    return 'post'
                  }
                }
              }
            ]
          }
        ]
      }
    }

    var stubGet2xxResponse = function (operation) {
      return {}
    }

    var stubGetQueryString = function (operation) {
      return 'queryString'
    }

    var stubGetBody = sinon.stub()
    stubGetBody.onCall(0).returns({ body: 'body' })
    stubGetBody.onCall(1).returns(null)

    var stubSetHeaders = function (operation, contentType, params) {
      params.headers = 'headers'
    }

    var stubSetCurl = function (params) {
      params.curl = 'curl'
    }

    var stubRamlParser = {
      parse: function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            resolve(model)
          }, 10)
        })
      }
    }

    var stubWrite = {
      writeExampleFiles (params, templates, examplesPath, rootDirectory) {
        expect(_.isEqual(params, expectedParams[spy.callCount - 1])).to.equal(true)
      },
      writeDebug (debug, params, examplesPath) {}
    }
    var stubReporter = {
      debug: function (message) {},
      log: function (message) {}
    }

    var spy = sinon.spy(stubWrite, 'writeExampleFiles')
    reverts = []
    reverts.push(ramlParser.__set__('wap.raml10', stubRamlParser))
    reverts.push(ramlParser.__set__('write', stubWrite))
    reverts.push(ramlParser.__set__('get2xxResponse', stubGet2xxResponse))
    reverts.push(ramlParser.__set__('getQueryString', stubGetQueryString))
    reverts.push(ramlParser.__set__('getBody', stubGetBody))
    reverts.push(ramlParser.__set__('setHeaders', stubSetHeaders))
    reverts.push(ramlParser.__set__('setCurl', stubSetCurl))
    reverts.push(ramlParser.__set__('reporter', stubReporter))

    info.languages = ['python', 'unirest.node', 'curl']

    var params = {}
    var expectedParams = [
      {
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
        uri: '/products/{version}',
        desc: 'Desc2',
        ok: {},
        request_method: 'post',
        query_string: 'queryString',
        body: null,
        headers: 'headers',
        curl: 'curl'
      }
    ]

    ramlParser.parse('./', './', './', params).then(() => {
      expect(spy.callCount).to.equal(2)

      done()
    })
  })
})
