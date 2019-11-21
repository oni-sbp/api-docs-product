const expect = require('chai').expect
const fs = require('fs-extra')
const tempDirectory = require('temp-dir')
const pathLib = require('path')
const loader = require('./loader')
const tempFilesFactory = require('./test-utils').tempFilesFactory
const info = require('../info')

describe('test loader.js', () => {
  describe('test loadCodeSamples', () => {
    it('test base loading', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)
      info.setLanguages({ python: 'on', 'unirest.node': 'on', curl: 'on' })

      tempFilesFactory(tmpFolder, [
        'api/endpoint/POST/sample.js',
        'api/endpoint/POST/sample.py',
        'api/endpoint/POST/curl',
        'api/endpoint/POST/trash'
      ])

      var samples = loader.loadCodeSamples(tmpFolder)

      expect(samples.length).to.equal(3)

      var filenames = ['sample.js', 'sample.py', 'curl']
      for (var index in filenames) {
        var filename = filenames[index]
        var path = tmpFolder + 'api/endpoint/POST/' + filename
        var found = false
        for (var sampleIndex in samples) {
          var sample = samples[sampleIndex]

          if (sample.path === path && sample.name === 'api/endpoint' && sample.httpMethod === 'POST') {
            found = true
          }
        }

        expect(found).to.equal(true)
      }

      fs.removeSync(tmpFolder)
    })

    it('test correct name is loaded', () => {
      var tests = [
        { path: 'api/u.raml/_users_v1/GET/curl', expectedName: 'api/users/v1' },
        { path: 'api/u.raml/_users_v1_{from}_link_{to}/GET/curl', expectedName: 'api/users/v1/{from}/link/{to}' },
        { path: 'api/u.raml/_users_v1_{from}_link_{to}_{type}/GET/curl', expectedName: 'api/users/v1/{from}/link/{to}/{type}' },
        { path: 'api/u.raml/_users_v1_{from_id}/GET/curl', expectedName: 'api/users/v1/{from_id}' },
        { path: 'api/u.raml/users/GET/curl', expectedName: 'api/users' }
      ]
      info.setLanguages({ curl: 'on' })

      for (var testIndex in tests) {
        var test = tests[testIndex]

        var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
        if (fs.existsSync(tmpFolder)) {
          fs.removeSync(tmpFolder)
        }
        fs.mkdirSync(tmpFolder)

        tempFilesFactory(tmpFolder, [test.path])

        var samples = loader.loadCodeSamples(tmpFolder)

        expect(samples.length).to.equal(1)
        expect(samples[0].name).to.equal(test.expectedName)

        fs.removeSync(tmpFolder)
      }
    })

    it('test http methods parsing', () => {
      var tests = [
        { dirName: 'POST', expectedMethod: 'POST' },
        { dirName: 'GET', expectedMethod: 'GET' },
        { dirName: 'DELETE', expectedMethod: 'DELETE' },
        { dirName: 'PUT', expectedMethod: 'PUT' }
      ]
      info.setLanguages({ 'unirest.node': 'on' })

      for (var testIndex in tests) {
        var test = tests[testIndex]

        var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
        if (fs.existsSync(tmpFolder)) {
          fs.removeSync(tmpFolder)
        }
        fs.mkdirSync(tmpFolder)
        tempFilesFactory(tmpFolder, ['api/' + test.dirName + '/sample.js'])

        var samples = loader.loadCodeSamples(tmpFolder)

        expect(samples.length).to.equal(1)
        expect(samples[0].httpMethod).to.equal(test.expectedMethod)

        fs.removeSync(tmpFolder)
      }
    })

    it('test sorting by endpoint', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)

      tempFilesFactory(tmpFolder, [
        'api/endpoint/PUT/curl',
        'api/endpoint/DELETE/curl',
        'api/endpoint/GET/curl',
        'api/endpoint/POST/curl'
      ])
      info.setLanguages({ curl: 'on' })

      var samples = loader.loadCodeSamples(tmpFolder)
      var methods = []

      for (var sampleIndex in samples) {
        var sample = samples[sampleIndex]

        methods.push(sample.httpMethod)
      }

      expect(methods).to.eql(['POST', 'GET', 'PUT', 'DELETE'])

      fs.removeSync(tmpFolder)
    })

    it('test loading by keyword', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)
      info.setLanguages({ curl: 'on' })

      tempFilesFactory(tmpFolder, [
        'one-api/resource/POST/curl',
        'another-one-api/resource/DELETE/curl',
        'api/resource/POST/curl',
        'on-more-api/resource/DELETE/curl'
      ])

      var samples = loader.loadCodeSamples(tmpFolder, 'one')
      expect(samples.length).to.equal(2)

      fs.removeSync(tmpFolder)
    })

    it('test parents and child sorting simple', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)
      info.setLanguages({ curl: 'on' })

      tempFilesFactory(tmpFolder, [
        'api/_parent/POST/curl',
        'api/_parent_{id}/DELETE/curl',
        'api/_parent_{id}_child/POST/curl',
        'api/_parent_{id}_child_{childId}/DELETE/curl'
      ])

      var samples = loader.loadCodeSamples(tmpFolder)

      var sortedNames = []
      for (var sampleIndex in samples) {
        var sample = samples[sampleIndex]

        sortedNames.push({ name: sample.name, httpMethod: sample.httpMethod })
      }

      var expectedNames = [
        { name: 'api/parent', httpMethod: 'POST' },
        { name: 'api/parent/{id}/child', httpMethod: 'POST' },
        { name: 'api/parent/{id}/child/{childId}', httpMethod: 'DELETE' },
        { name: 'api/parent/{id}', httpMethod: 'DELETE' }
      ]

      expect(sortedNames).to.eql(expectedNames)

      fs.removeSync(tmpFolder)
    })

    it('test parents and child sorting all methods', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)
      info.setLanguages({ curl: 'on' })

      var fileStructure = [
        ['api/_parent', ['GET', 'POST']],
        ['api/_parent_{id}', ['GET', 'PUT', 'DELETE']],
        ['api/_parent_{id}_child', ['GET', 'POST']],
        ['api/_parent_{id}_child_{childId}', ['GET', 'PUT', 'DELETE']]
      ]

      var files = []
      for (var endpointIndex in fileStructure) {
        var endpoint = fileStructure[endpointIndex]

        for (var methodIndex in endpoint[1]) {
          var method = endpoint[1][methodIndex]

          files.push(endpoint[0] + '/' + method + '/curl')
        }
      }

      tempFilesFactory(tmpFolder, files)

      var samples = loader.loadCodeSamples(tmpFolder)

      var sortedNames = []
      for (var sampleIndex in samples) {
        var sample = samples[sampleIndex]

        sortedNames.push({ name: sample.name, httpMethod: sample.httpMethod })
      }

      var expectedNames = [
        { name: 'api/parent', httpMethod: 'POST' },
        { name: 'api/parent', httpMethod: 'GET' },
        { name: 'api/parent/{id}', httpMethod: 'GET' },
        { name: 'api/parent/{id}', httpMethod: 'PUT' },
        { name: 'api/parent/{id}/child', httpMethod: 'POST' },
        { name: 'api/parent/{id}/child', httpMethod: 'GET' },
        { name: 'api/parent/{id}/child/{childId}', httpMethod: 'GET' },
        { name: 'api/parent/{id}/child/{childId}', httpMethod: 'PUT' },
        { name: 'api/parent/{id}/child/{childId}', httpMethod: 'DELETE' },
        { name: 'api/parent/{id}', httpMethod: 'DELETE' }
      ]

      expect(sortedNames).to.eql(expectedNames)

      fs.removeSync(tmpFolder)
    })
  })
})
