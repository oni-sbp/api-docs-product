const expect = require('chai').expect
const rewire = require('rewire')
const resourceRegistry = rewire('./resource-registry.js')

var reverts = []

describe('test validation/resources/resource-registry.js', () => {
  afterEach(function () {
    for (var revert in reverts) {
      reverts[revert]()
    }
  })

  it('test resource registry create with replacements', (done) => {
    var stubNewResource = function (a) {
      class Resource {
        async create () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              resolve({ statusCode: 200, body: { '@id': 'John' } })
            }, 10)
          })
        }
      }

      return new Resource()
    }

    reverts.push(resourceRegistry.__set__('newResource', stubNewResource))

    var resourceReg = new resourceRegistry.ResourceRegistry()

    resourceReg.create('name', { '@id': 'id' }).then((result) => {
      expect(result).to.eql({ id: 'John' })

      done()
    })
  })
})
