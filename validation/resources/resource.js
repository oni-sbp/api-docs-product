const request = require('request')
const debug = require('../../reporter').debug

class Resource {
  constructor (baseUrl) {
    this.baseUrl = baseUrl
    this._created = false
    this._deleted = false
  }

  async create (payload) {
    debug('Creating ' + this.constructor.name)
    var result = await this._create(payload)

    var code = result.code
    var response = result.body

    if (this.idField()) {
      debug('Success (' + code + '): ' + this.idField())
    } else {
      var responseData = response || ''
      debug('Status code: ' + code + ' ' + responseData)
    }

    this._created = true
    return result
  }

  async delete () {
    debug('Removing ' + this.constructor.name + '<' + this.idField() + '>')
    var response = await this._delete()
    this._deleted = true
    return response
  }

  deleted () {
    return this._deleted
  }

  _delete () {
    throw new Error('You haven\'t implemented this method')
  }

  async _create (payload) {
    throw new Error('You haven\'t implemented this method')
  }

  generatePayload () {
    throw new Error('You haven\'t implemented this method')
  }
}

async function _createResource (url, payload = null, accessToken = null, headers = null) {
  if (accessToken) {
    headers = headers || {}
    headers.Authorization = 'Bearer ' + accessToken
  }

  return new Promise(function (resolve, reject) {
    // var proxyUrl = 'http://192.168.1.202:8889';
    // var proxiedRequest = request.defaults({'proxy': proxyUrl});
    // proxiedRequest.post( {url: url, body: payload, headers: headers, json: true}, function(error, response, body) {
    //     var code = response.statusCode;
    //     try {
    //         var result = {code: code, body: body};
    //         resolve(result);
    //     } catch {
    //         var result = {code: code, body: null};
    //         resolve(result);
    //     }
    // });

    request.post({ url: url, body: payload, headers: headers, json: true }, function (error, response, body) {
      if (error) {
        console.log(error)
      }
      if (response) {
        var code = response.statusCode
        try {
          var result = { code: code, body: body }
          resolve(result)
        } catch {
          result = { code: code, body: null }
          resolve(result)
        }
      } else {
        resolve({ code: null, body: null })
      }
    })
  })
}

async function _deleteResource (url, accessToken = null, headers = null) {
  if (accessToken) {
    headers = headers || {}
    headers.Authorization = 'Bearer ' + accessToken
  }

  return new Promise(function (resolve, reject) {
    // var proxyUrl = 'http://192.168.1.202:8889';
    // var proxiedRequest = request.defaults({'proxy': proxyUrl});
    // proxiedRequest.delete({url: url, headers: headers}, function(error, response, body) {
    //     resolve(response.statusCode);
    // });

    request.delete({ url: url, headers: headers }, function (error, response, body) {
      if (error) {
        console.log(error)
      }

      if (response) {
        resolve(response.statusCode)
      } else {
        resolve(null)
      }
    })
  })
}

module.exports = {
  Resource,
  _createResource,
  _deleteResource
}
