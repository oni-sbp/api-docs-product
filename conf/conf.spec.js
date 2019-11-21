const expect = require('chai').expect
const sinon = require('sinon')
const rewire = require('rewire')
const config = rewire('./conf')
const _ = require('underscore')
var reverts = []

describe('test validation/conf.js', () => {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test loadConfigFile', () => {
    var doc = {
      sample_timeout: 10,
      debug: false,
      api_url: '$TESTING_API_URL',
      access_token: '$AUTH_TOKEN',
      substitutions: {
        '{version}': 'v1',
        '<ACCESS_TOKEN>': '$AUTH_TOKEN',
        'api-sandbox.oftrust.net': '$TESTING_API_URL'
      },
      resp_attr_replacements: {
        'product-api/products/{version}': [{
          productCode: 'product_code'
        }],
        'message-api/messages/{version}': [{
          '@id': 'id'
        }],
        'calendar-api/calendars/{version}': [{
          '@id': 'id'
        }],
        'identity-api/identities/v1': [{
          '@id': 'id'
        }],
        'identity-api/identities/v1/{from_identity}/link/{to_identity}': [{
          '@type': 'type'
        }]
      },
      before_sample: {
        'message-api/messages/{version}': [{
          resource: 'Identity',
          method: 'POST',
          subs: {
            '@id': '0920a84a-1548-4644-b95d-e3f80e1b9ca6'
          }
        }],
        'calendar-api/calendars/{version}': [{
          resource: 'Identity',
          method: 'POST',
          subs: {
            '@id': '0920a84a-1548-4644-b95d-e3f80e1b9ca6'
          }
        }],
        'identity-api/identities/v1/{from_identity}/link/{to_identity}': [
          {
            resource: 'Identity',
            method: 'POST',
            subs: {
              '@id': '{to_identity}'
            }
          },
          {
            resource: 'Identity',
            method: 'POST',
            subs: {
              '@id': '{from_identity}'
            }
          }
        ],
        'product-api/products/{version}': [
          {
            resource: 'DeleteProduct',
            method: 'POST',
            subs: {}
          }
        ]
      },
      ignore_failures: {
        'broker-api/broker/{version}/fetch-data-product': [
          'POST'
        ],
        'product-api/products/{version}/{product_code}': [
          'DELETE'
        ]
      }
    }
    var yamlStub = {
      safeLoad (input) {
        return doc
      }
    }
    var fsStub = {
      readFileSync (path, param) {
        return ''
      }
    }

    reverts = []
    reverts.push(config.__set__('yaml', yamlStub))
    reverts.push(config.__set__('fs', fsStub))

    var conf = new config.Config()
    var replaceEnvVarsStub = sinon.stub(conf, 'replaceEnvVars')

    conf.loadConfigFile('')

    for (var key in doc) {
      expect(_.isEqual(conf[key], doc[key])).to.equal(true)
    }

    replaceEnvVarsStub.restore()
  })

  it('test replaceEnvVars', () => {
    var conf = new config.Config()
    conf.substitutions = {
      var: '$GOOD_VAR',
      var2: '$BAD_VAR'
    }
    conf.api_url = '$TESTING_API_URL'
    conf.access_token = '$AUTH_TOKEN'

    var infoStub = {
      env: {
        GOOD_VAR: 'value',
        TESTING_API_URL: 'value1',
        AUTH_TOKEN: 'value2'
      }
    }

    reverts = []
    reverts.push(config.__set__('info', infoStub))

    conf.replaceEnvVars()

    expect(conf.substitutions.var).to.equal('value')
    expect(conf.api_url).to.equal('value1')
    expect(conf.access_token).to.equal('value2')

    expect(() => conf.replaceEnvVars(true)).to.throw(Error, 'Failed to find variables in the environment: BAD_VAR')
  })
})
