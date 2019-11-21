const PythonRunner = require('./runners/python').PythonRunner
const CurlRunner = require('./runners/curl').CurlRunner
const NodeRunner = require('./runners/js').NodeRunner
const TestExecutionResultMap = require('./validation-classes').TestExecutionResultMap
const ResourceRegistry = require('./resources/resource-registry').ResourceRegistry
const info = require('../info')
const Reporter = require('../reporter').Reporter

class TestSession {
  constructor (samples) {
    this.runners = {
      'unirest.node': new NodeRunner(),
      python: new PythonRunner(),
      curl: new CurlRunner()
    }

    this.samples = samples
    this._testResultsMap = new TestExecutionResultMap()
    this._resourceRegistry = new ResourceRegistry()
  }

  async run () {
    var reporter = new Reporter()
    var samplesByLang = {
      'unirest.node': [],
      python: [],
      curl: []
    }

    var results = []

    for (var sampleIndex in this.samples) {
      var sample = this.samples[sampleIndex]
      samplesByLang[sample.language()].push(sample)
    }

    for (var lang in samplesByLang) {
      results = results.concat(await this.runApiTestsForLang(samplesByLang[lang], lang))
    }

    reporter.printTestSessionReport(results)
    var failedCount = 0
    for (var result in results) {
      failedCount += results[result].failed() ? 1 : 0
    }

    return failedCount
  }

  async runApiTestsForLang (samples, lang) {
    Reporter.showLanguageScopeRun(lang)

    var testResults = []
    var dataSubstitutions = {}
    var allSubstitutions = {}

    for (var sampleIndex in samples) {
      var sample = samples[sampleIndex]
      var prerequisiteSubs = await this.extractPrerequisiteSubs(sample)
      var substitutions = await this.getSubstitutions(sample, lang, dataSubstitutions, allSubstitutions, prerequisiteSubs)
      allSubstitutions = Object.assign(allSubstitutions, substitutions)

      Reporter.showTestIsRunning(sample)
      var testResult = this.runners[lang].runSample(sample, substitutions)

      this._testResultsMap.put(testResult, info.conf.resp_attr_replacements[sample.name], prerequisiteSubs)
      testResults.push(testResult)

      dataSubstitutions = Object.assign(dataSubstitutions, this.requestSubstitutions(sample))
      dataSubstitutions = Object.assign(dataSubstitutions, this.makeSubstitutions(testResult.jsonBody))
      Reporter.showShortTestStatus(testResult)
    }

    await this._resourceRegistry.cleanup()
    return testResults
  }

  async getSubstitutions (sample, lang, dataSubstitutions, allSubstitutions, prerequisiteSubs) {
    var beforeSampleSubstitutions = this.beforeSampleSubstitutions(sample, lang)
    var substitutions = this._testResultsMap.getParentBody(sample, true)
    var confSubstitutions = info.conf.substitutions ? info.conf.substitutions : {}

    substitutions = Object.assign(substitutions, allSubstitutions)
    substitutions = Object.assign(substitutions, dataSubstitutions)
    substitutions = Object.assign(substitutions, prerequisiteSubs)
    substitutions = Object.assign(substitutions, confSubstitutions)
    substitutions = Object.assign(substitutions, beforeSampleSubstitutions)

    return substitutions
  }

  async extractPrerequisiteSubs (sample) {
    if (!info.conf.before_sample[sample.name]) {
      return {}
    }

    var prerequisiteSubs = {}
    for (var paramIndex in info.conf.before_sample[sample.name]) {
      var params = info.conf.before_sample[sample.name][paramIndex]

      if (params.method === sample.httpMethod) {
        var subs = await this._resourceRegistry.create(params.resource, params.subs)
        prerequisiteSubs = Object.assign(prerequisiteSubs, subs)
      }
    }

    return prerequisiteSubs
  }

  requestSubstitutions (sample) {
    if (info.conf.substitutions_before_sample[sample.name]) {
      for (var paramIndex in info.conf.substitutions_before_sample[sample.name]) {
        var params = info.conf.substitutions_before_sample[sample.name][paramIndex]

        if (params.method === sample.httpMethod && params.subs['{BODY}']) {
          var jsonBody = JSON.parse(params.subs['{BODY}'])
          if (Array.isArray(jsonBody)) {
            if (jsonBody.length > 0) {
              return this.makeSubstitutions(jsonBody[0])
            }
            return {}
          }

          return this.makeSubstitutions(jsonBody)
        }
      }
    }

    return {}
  }

  beforeSampleSubstitutions (sample, lang) {
    var substitutions = { '{BODY}': '{}' }

    if (info.conf.substitutions_before_sample[sample.name]) {
      for (var paramIndex in info.conf.substitutions_before_sample[sample.name]) {
        var params = info.conf.substitutions_before_sample[sample.name][paramIndex]

        if (params.method === sample.httpMethod) {
          substitutions = Object.assign(substitutions, params.subs)

          break
        }
      }
    }

    if (lang === 'curl') {
      if (substitutions['{BODY}'][substitutions['{BODY}'].length - 1] === '\n') {
        substitutions['{BODY}'] = substitutions['{BODY}'].slice(0, -1)
      }
      substitutions['{BODY}'] = substitutions['{BODY}'].replace(/"/g, '\\"')
    }

    if (lang === 'python') {
      substitutions['{BODY}'] = substitutions['{BODY}'].replace(/true/g, 'True')
      substitutions['{BODY}'] = substitutions['{BODY}'].replace(/false/g, 'False')
    }

    return substitutions
  }

  makeSubstitutions (body) {
    var substitutions = {}

    for (var key in body) {
      if (body[key]) {
        var value = body[key].constructor === String ? body[key] : JSON.stringify(body[key])
        if (key.startsWith('{')) {
          substitutions[key] = value
        } else {
          substitutions['{' + key + '}'] = value
        }
      }
    }

    return substitutions
  }
}

module.exports = {
  TestSession
}
