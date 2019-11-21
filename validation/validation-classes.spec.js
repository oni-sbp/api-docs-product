const expect = require('chai').expect
const info = require('../info')
const _ = require('underscore')
const { ApiTestResult, TestExecutionResultMap, CodeSamplesTree, CodeSample } = require('./validation-classes')
const tempDirectory = require('temp-dir')
const pathLib = require('path')
const fs = require('fs-extra')
const tempFilesFactory = require('./test-utils').tempFilesFactory
const loader = require('./loader')

describe('test validation/validation-classes.js', () => {
  describe('test CodeSample', () => {
    it('test language', () => {
      expect(new CodeSample('name.py', '', '').language()).to.equal('python')
      expect(new CodeSample('name.js', '', '').language()).to.equal('unirest.node')
      expect(new CodeSample('curl', '', '').language()).to.equal('curl')
    })
  })

  describe('test CodeSamplesTree', () => {
    it('test putCodeSample', () => {
      var codeSamplesTree = new CodeSamplesTree()

      var codeSamples = [
        new CodeSample('a_b.py', '/a/b/c', 'GET'),
        new CodeSample('name.js', '/a/b', 'GET'),
        new CodeSample('curl', '/a/b', 'GET')
      ]

      for (var sampleIndex in codeSamples) {
        codeSamplesTree.put(codeSamples[sampleIndex])
      }

      var expectedTree = { python: { a: { b: { c: { methods: { GET: { path: 'a_b.py', name: '/a/b/c', httpMethod: 'GET' } } } } } }, 'unirest.node': { a: { b: { methods: { GET: { path: 'name.js', name: '/a/b', httpMethod: 'GET' } } } } }, curl: { a: { b: { methods: { GET: { path: 'curl', name: '/a/b', httpMethod: 'GET' } } } } } }
      expect(_.isEqual(JSON.stringify(expectedTree), JSON.stringify(codeSamplesTree.tree))).to.equal(true)
    })

    it('test sortSamples', () => {
      var codeSamplesTree = new CodeSamplesTree()

      var codeSample1 = new CodeSample('a_b.py', '/a/b/', 'PUT')
      var codeSample2 = new CodeSample('a_b.py', '/a/b/', 'DELETE')
      var codeSample3 = new CodeSample('a_b.py', '/a/b/', 'GET')
      var codeSample4 = new CodeSample('a_b.py', '/a/b', 'POST')

      var codeSamples = [
        codeSample1,
        codeSample2,
        codeSample3,
        codeSample4
      ]

      for (var sampleIndex in codeSamples) {
        codeSamplesTree.put(codeSamples[sampleIndex])
      }

      var sortedSamples = codeSamplesTree.listSortedSamples()

      expect(_.isEqual(sortedSamples[0], codeSample4)).to.equal(true)
      expect(_.isEqual(sortedSamples[3], codeSample2)).to.equal(true)
    })
  })

  describe('test TestExecutionResultMap', () => {
    it('test save and load test result to map', () => {
      var tmpFolder = tempDirectory + pathLib.sep + 'TempTestFile' + pathLib.sep
      if (fs.existsSync(tmpFolder)) {
        fs.removeSync(tmpFolder)
      }
      fs.mkdirSync(tmpFolder)

      tempFilesFactory(tmpFolder, [
        'api/user/POST/curl',
        'api/user/{id}/GET/curl',
        'api/user/{id}/friend/POST/curl',
        'api/user/{id}/friend/{fid}/GET/curl'
      ])
      info.setLanguages({ curl: 'on' })

      var samples = loader.loadCodeSamples(tmpFolder)

      var parentSample = samples[0]
      var childSample = samples[1]
      var childSamplePost = samples[2]
      var grandChildSample = samples[3]

      var resultMap = new TestExecutionResultMap()

      resultMap.put(new ApiTestResult({
        sample: parentSample,
        passed: true,
        jsonBody: { 1: 2 }
      }))

      resultMap.put(new ApiTestResult({
        sample: childSample,
        passed: true
      }))

      resultMap.put(new ApiTestResult({
        sample: childSamplePost,
        passed: true,
        jsonBody: { 3: 4 }
      }))

      expect(resultMap.getParentResult(parentSample)).to.equal(null)
      expect(_.isEqual(resultMap.getParentResult(childSample).sample, parentSample)).to.equal(true)

      expect(_.isEqual(resultMap.getParentBody(parentSample), {})).to.equal(true)
      expect(_.isEqual(resultMap.getParentBody(childSample), { 1: 2 })).to.equal(true)

      expect(_.isEqual(resultMap.getParentBody(grandChildSample), { 1: 2, 3: 4 })).to.equal(true)

      fs.removeSync(tmpFolder)
    })
  })
})
