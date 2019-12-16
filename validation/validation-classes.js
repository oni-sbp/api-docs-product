const info = require('../info')

class CodeSample {
  constructor (path, name, httpMethod) {
    this.path = path
    this.name = name
    this.httpMethod = httpMethod
  }

  language () {
    for (var language in info.acceptedLanguages) {
      if (this.path.endsWith(info.extension[info.acceptedLanguages[language]])) {
        return info.acceptedLanguages[language]
      }
    }
  }
}

class CodeSamplesTree {
  constructor (request) {
    this.request = request
    this.tree = {}
    this.defaultOrder = ['POST', 'GET', 'PUT', 'DELETE']
    this.nonDeleteMethods = ['POST', 'GET', 'PUT']
  }

  put (sample) {
    this.putCodeSample(this.tree, sample.language() + sample.name, sample)
  }

  putCodeSample (currentDict, path, sample) {
    var pathParts = path.split('/')
    var currentPath = pathParts[0]
    var furtherPath = pathParts.slice(1).join('/')

    if (typeof (currentDict[currentPath]) === 'undefined') {
      currentDict[currentPath] = {}
    }

    if (!furtherPath) {
      if (!currentDict[currentPath].methods) {
        currentDict[currentPath].methods = {}
      }
      currentDict[currentPath].methods[sample.httpMethod] = sample
    } else {
      this.putCodeSample(currentDict[currentPath], furtherPath, sample)
    }

    return currentDict
  }

  listSortedSamples () {
    var sortedSamples = []
    this.sortSamples(this.tree, sortedSamples)
    return sortedSamples
  }

  sortSamples (endpoints, resultList) {
    var methods = {}
    var endpointName = ''
    var method

    if (endpoints.methods) {
      methods = endpoints.methods

      for (method in methods) {
        endpointName = methods[method].name
      }
    }

    var methodsOrder = this.defaultOrder
    if (this.request.conf.operations_order[endpointName]) {
      methodsOrder = this.request.conf.operations_order[endpointName]
    }

    var methodsRemained = []
    var reachDelete = false
    var methodIndex
    for (methodIndex in methodsOrder) {
      method = methodsOrder[methodIndex]
      if (!reachDelete && this.nonDeleteMethods.indexOf(method) !== -1) {
        if (method in methods) {
          resultList.push(methods[method])
        }
      } else {
        reachDelete = true
        methodsRemained.push(method)
      }
    }

    var furtherPaths = []
    var name
    for (name in endpoints) {
      if (name !== 'methods') {
        furtherPaths.push(name)
      }
    }

    if (furtherPaths !== []) {
      for (name in furtherPaths) {
        this.sortSamples(endpoints[furtherPaths[name]], resultList)
      }
    }

    for (methodIndex in methodsRemained) {
      method = methodsRemained[methodIndex]
      if (method in methods) {
        resultList.push(methods[method])
      }
    }
  }
}

class ApiTestResult {
  constructor (request, params) {
    this.request = request
    for (var option in params) {
      this[option] = params[option]
    }
  }

  ignored () {
    if (!this.passed && this.request.conf.ignore_failures[this.sample.name]) {
      var ignoredMethods = this.request.conf.ignore_failures[this.sample.name]

      return ignoredMethods.includes(this.sample.httpMethod)
    }

    return false
  }

  failed () {
    return !this.passed && !this.ignored()
  }
}

class SystemCmdResult {
  constructor (exitCode, stdout, stderr) {
    this.exitCode = exitCode
    this.stdout = stdout
    this.stderr = stderr
  }
}

class TestExecutionResultMap {
  constructor () {
    this._map = {}
  }

  put (testResult, replaceKeys = null, extra = null) {
    replaceKeys = replaceKeys || []
    extra = extra || {}
    var parentBody = testResult.jsonBody ? testResult.jsonBody : {}

    for (var replacementIndex in replaceKeys) {
      var replacement = replaceKeys[replacementIndex]
      for (var keyFrom in replacement) {
        if (parentBody[keyFrom]) {
          parentBody[replacement[keyFrom]] = parentBody[keyFrom]
        }
      }
    }

    parentBody = Object.assign(parentBody, extra)
    this._putTestResult(this._map, testResult, testResult.sample.name)
  }

  getParentResult (sample) {
    return this._getParentTestResult(this._map, sample, sample.name, {})
  }

  getParentBody (sample, escaped) {
    var body = {}
    this._getParentTestResult(this._map, sample, sample.name, body)

    if (escaped) {
      var newBody = {}
      for (var key in body) {
        if (key.startsWith('{')) {
          newBody[key] = body[key]
        } else {
          newBody['{' + key + '}'] = body[key]
        }
      }
      body = newBody
    }

    return body
  }

  _putTestResult (currentDict, testResult, path) {
    var pathParts = path.split('/')
    var currentPath = pathParts[0]
    var furtherPath = pathParts.slice(1).join('/')

    if (typeof (currentDict[currentPath]) === 'undefined') {
      currentDict[currentPath] = {}
    }

    if (!furtherPath) {
      if (!currentDict[currentPath].methods) {
        currentDict[currentPath].methods = {}
      }
      currentDict[currentPath].methods[testResult.sample.httpMethod] = testResult
    } else {
      this._putTestResult(currentDict[currentPath], testResult, furtherPath)
    }

    return currentDict
  }

  _getParentTestResult (currentDict, sample, path, currentBody, currentParent = null) {
    var pathParts = path.split('/')
    var currentPath = pathParts[0]
    var furtherPath = pathParts.slice(1).join('/')

    var currentMethods = {}
    if (currentDict.methods) {
      currentMethods = currentDict.methods
    }

    if (currentMethods.POST) {
      currentParent = currentMethods.POST
    }

    if (currentParent && currentParent.jsonBody) {
      currentBody = Object.assign(currentBody, currentParent.jsonBody)
    }

    var nextDict = currentDict[currentPath]
    if (!nextDict) {
      return currentParent
    }

    if (!furtherPath) {
      return currentParent
    }

    return this._getParentTestResult(nextDict, sample, furtherPath, currentBody, currentParent)
  }
}

module.exports = {
  CodeSample,
  CodeSamplesTree,
  ApiTestResult,
  SystemCmdResult,
  TestExecutionResultMap
}
