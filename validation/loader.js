const utils = require('./validation-classes')
const fs = require('fs')
const pathLib = require('path')
const info = require('../info')
const reporter = require('../reporter')

function getHttpMethodFromPath (path) {
  var splittedPath = []
  splittedPath = path.split(pathLib.sep)

  return splittedPath[splittedPath.length - 2].toUpperCase()
}

function makeSampleNameFromPath (path) {
  var splittedPath = path.split(pathLib.sep)
  splittedPath = splittedPath.slice(0, splittedPath.length - 2)

  var insidePlaceholder = false
  var endpoint = ''

  var str = splittedPath[splittedPath.length - 1]
  for (var i = 0; i < str.length; i++) {
    var char = str.charAt(i)
    if (char === '_' && !insidePlaceholder) {
      endpoint += '/'
      continue
    }

    if (char === '{') {
      insidePlaceholder = true
    }

    if (char === '}') {
      insidePlaceholder = false
    }

    endpoint += char
  }

  var parents = splittedPath.slice(0, splittedPath.length - 1).filter(name => !name.endsWith('.raml')).join('/')

  if (!endpoint.startsWith('/')) {
    parents += '/'
  }

  return parents + endpoint
}

function sortCodeSamples (samples) {
  var samplesTree = new utils.CodeSamplesTree()

  for (var sampleIndex in samples) {
    samplesTree.put(samples[sampleIndex])
  }

  return samplesTree.listSortedSamples()
}

function getFilesRecursively (path) {
  var files = []
  var currentFolder = fs.readdirSync(path)

  currentFolder.forEach(function (item) {
    var fullPath = path + item

    try {
      var stat = fs.statSync(fullPath)

      if (stat && stat.isDirectory()) {
        files = files.concat(getFilesRecursively(fullPath + pathLib.sep))
      } else {
        files.push(fullPath)
      }
    } catch (err) {
      reporter.log(err)
    }
  })

  return files
}

function validExtension (file, validExtensions) {
  for (var extensionIndex in validExtensions) {
    if (file.endsWith(validExtensions[extensionIndex])) {
      return true
    }
  }
  return false
}

function loadCodeSamples (root, keyword = '') {
  var languages = info.validationLanguages
  var samples = []
  var validExtensions = []

  for (var language in languages) {
    validExtensions.push(info.fileNameEnding[languages[language]])
  }

  var files = getFilesRecursively(root)

  for (var fileIndex in files) {
    var file = files[fileIndex]

    if (validExtension(file, validExtensions)) {
      var httpMethod = getHttpMethodFromPath(file)
      var name = makeSampleNameFromPath(pathLib.relative(root, file))

      var sample = new utils.CodeSample(file, name, httpMethod)
      if (languages.indexOf(sample.language()) !== -1 && name.indexOf(keyword) !== -1) {
        samples.push(sample)
      }
    }
  }

  return sortCodeSamples(samples)
}

module.exports = {
  loadCodeSamples
}
