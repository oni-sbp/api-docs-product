const resources = require('./resources')

function newResource (name) {
  if (name === 'Identity') {
    return new resources.Identity()
  }

  if (name === 'DeleteProduct') {
    return new resources.DeleteProduct()
  }
}

class ResourceRegistry {
  constructor () {
    this.resources = []
    this.allResources = {}
  }

  async create (name, substitutions) {
    var filteredBody = {}

    var resource = newResource(name)
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
