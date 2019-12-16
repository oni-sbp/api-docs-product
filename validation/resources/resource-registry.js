const resources = require('./resources')

function newResource (request, name) {
  if (name === 'Identity') {
    return new resources.Identity(request)
  }

  if (name === 'DeleteProduct') {
    return new resources.DeleteProduct(request)
  }
}

class ResourceRegistry {
  constructor (request) {
    this.resources = []
    this.allResources = {}
    this.request = request
  }

  async create (name, substitutions) {
    var filteredBody = {}

    var resource = newResource(this.request, name)
    var response = await resource.create()
    var body = response.body ? response.body : {}

    this.resources.push(resource)

    for (var key in substitutions) {
      if (body[key]) {
        filteredBody[substitutions[key]] = body[key]
      }
    }

    return filteredBody
  }

  async cleanup () {
    for (var resourceIndex in this.resources) {
      if (!this.resources[resourceIndex].deleted()) {
        await this.resources[resourceIndex].delete()
      }
    }
  }
}

module.exports = {
  ResourceRegistry
}
