const PythonRunner = require('./runners/python').PythonRunner
const CurlRunner = require('./runners/curl').CurlRunner
const NodeRunner = require('./runners/js').NodeRunner
const JavaRunner = require('./runners/java').JavaRunner
const TestExecutionResultMap = require('./validation-classes').TestExecutionResultMap
const ResourceRegistry = require('./resources/resource-registry').ResourceRegistry
const Reporter = require('../reporter').Reporter
const info = require('../info')
const mongoDBManager = require('../mongoDBManager')

class TestSession {
  constructor (request, samples) {
    this.runners = {
      'unirest.node': new NodeRunner(request),
      python: new PythonRunner(request),
      curl: new CurlRunner(request),
      java: new JavaRunner(request)
    }

    this.samples = samples
    this.request = request
    this._testResultsMap = new TestExecutionResultMap()
    this._resourceRegistry = new ResourceRegistry(request)
  }

  async run () {
    var samplesByLang = {
      'unirest.node': [],
      python: [],
      curl: [],
      java: []
    }

    for (var sampleIndex in this.samples) {
      var sample = this.samples[sampleIndex]
      samplesByLang[sample.language()].push(sample)
    }

    setImmediate(this.runSamplesForLang, this, samplesByLang, [])
  }

  runSamplesForLang (testSession, samplesByLang, results) {
    // If there is no language left
    if (!Object.keys(samplesByLang).length) {
      var reporter = new Reporter(testSession.request)
      reporter.printTestSessionReport(results)
      var failedCount = 0
      for (var result in results) {
        failedCount += results[result].failed() ? 1 : 0
      }

      testSession.request.failedTests = failedCount
      mongoDBManager.insertOne('Generation', testSession.request.getElementForDB())
      info.requestReady[testSession.request.id] = true

      return
    }

    // We run tests for the first language left, after that we remove it
    for (var lang in samplesByLang) {
      Reporter.showLanguageScopeRun(lang, testSession.request)

      var samples = samplesByLang[lang].slice()
      delete samplesByLang[lang]

      setTimeout(testSession.runSample, 100, testSession, samples, 0, {}, {}, samplesByLang, results, lang)

      break
    }
  }

  async runSample (testSession, samples, index, dataSubstitutions, allSubstitutions, samplesByLang, results, lang) {
    // When all samples for this language are done
    if (index === samples.length) {
      await testSession._resourceRegistry.cleanup()

      setImmediate(testSession.runSamplesForLang, testSession, samplesByLang, results)

      return
    }

    // We run the current index sample
    var sample = samples[index]
    var prerequisiteSubs = await testSession.extractPrerequisiteSubs(sample)
    var substitutions = await testSession.getSubstitutions(sample, lang, dataSubstitutions, allSubstitutions, prerequisiteSubs)
    allSubstitutions = Object.assign(allSubstitutions, substitutions)

    Reporter.showTestIsRunning(sample, testSession.request)
    var testResult = testSession.runners[lang].runSample(sample, substitutions)

    testSession._testResultsMap.put(testResult, testSession.request.conf.resp_attr_replacements[sample.name], prerequisiteSubs)
    results.push(testResult)

    dataSubstitutions = Object.assign(dataSubstitutions, testSession.requestSubstitutions(sample))
    dataSubstitutions = Object.assign(dataSubstitutions, testSession.makeSubstitutions(testResult.jsonBody))
    Reporter.showShortTestStatus(testResult, testSession.request)

    setImmediate(testSession.runSample, testSession, samples, index + 1, dataSubstitutions, allSubstitutions, samplesByLang, results, lang)
  }

  async getSubstitutions (sample, lang, dataSubstitutions, allSubstitutions, prerequisiteSubs) {
    var beforeSampleSubstitutions = this.beforeSampleSubstitutions(sample, lang)
    var substitutions = this._testResultsMap.getParentBody(sample, true)
    var confSubstitutions = this.request.conf.substitutions ? this.request.conf.substitutions : {}

    substitutions = Object.assign(substitutions, allSubstitutions)
    substitutions = Object.assign(substitutions, dataSubstitutions)
    substitutions = Object.assign(substitutions, prerequisiteSubs)
    substitutions = Object.assign(substitutions, confSubstitutions)
    substitutions = Object.assign(substitutions, beforeSampleSubstitutions)

    return substitutions
  }

  async extractPrerequisiteSubs (sample) {
    if (!this.request.conf.before_sample[sample.name]) {
      return {}
    }

    var prerequisiteSubs = {}
    for (var paramIndex in this.request.conf.before_sample[sample.name]) {
      var params = this.request.conf.before_sample[sample.name][paramIndex]

      if (params.method === sample.httpMethod) {
        var subs = await this._resourceRegistry.create(params.resource, params.subs)
        prerequisiteSubs = Object.assign(prerequisiteSubs, subs)
      }
    }

    return prerequisiteSubs
  }

  requestSubstitutions (sample) {
    if (this.request.conf.substitutions_before_sample[sample.name]) {
      for (var paramIndex in this.request.conf.substitutions_before_sample[sample.name]) {
        var params = this.request.conf.substitutions_before_sample[sample.name][paramIndex]

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

    if (this.request.conf.substitutions_before_sample[sample.name]) {
      for (var paramIndex in this.request.conf.substitutions_before_sample[sample.name]) {
        var params = this.request.conf.substitutions_before_sample[sample.name][paramIndex]

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
