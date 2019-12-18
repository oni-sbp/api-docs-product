const resource = require('./resource')
const Resource = resource.Resource

class Identity extends Resource {
  constructor (request, baseUrl = null) {
    baseUrl = baseUrl || 'https://' + request.conf.api_url + '/identities/v1'
    super(request, baseUrl)
    this._idField = null
  }

  idField () {
    return this._idField
  }

  async _create (payload) {
    var response = await resource._createResource(this.baseUrl, this.generatePayload(), this.request.conf.access_token)

    if (response.code < 400 && response.body) {
      this._idField = response.body['@id']
    }

    return response
  }

  async _delete () {
    var result = await resource._deleteResource(this.baseUrl + '/' + this.idField(), this.request.conf.access_token)
    return result
  }

  generatePayload () {
    return {
      name: 'code-examples-validator',
      context: 'context',
      type: 'Owner',
      data: {
        name: 'code-examples-validator'
      }
    }
  }
}

class DeleteProduct extends Resource {
  constructor (request, baseUrl = null) {
    baseUrl = baseUrl || 'https://' + request.conf.api_url + '/products/v1'
    super(request, baseUrl)
  }

  newResource () {

  }

  async _create (payload) {
    var code = await resource._deleteResource(this.baseUrl + '/' + this.idField(), this.request.conf.access_token)

    return { code: code, body: null }
  }

  _delete () {
    return 200
  }

  idField () {
    return 'product-1'
  }

  generatePayload () {
    return {}
  }
}

module.exports = {
  Identity,
  DeleteProduct
}
