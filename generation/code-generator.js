const fs = require('fs-extra')
const info = require('../info')
const fileParser = require('./file-parser')
const pathLib = require('path')
const reporter = require('../reporter.js')
const constants = require('../constants')
const utils = require('../utils')
const Config = require('../conf/conf').Config

async function generateSamples (fields, files) {
  var path
  if (files.file.size !== 0) {
    // I received a file or archive
    path = await utils.createTempSourceFileFromFile(files.file)
  } else {
    // I received an URL
    path = await utils.createTempSourceFileFromUrl(fields.url)
  }

  var allFiles = getAllFiles(path)

  if (allFiles.length === 0) {
    return ''
  }

  var host = fields.host
  var scheme = fields.scheme

  info.setLanguages(fields)

  if (!fs.existsSync(constants.GENERATED_EXAMPLES_FOLDER)) {
    fs.mkdirSync(constants.GENERATED_EXAMPLES_FOLDER)
  } else {
    try {
      fs.removeSync(constants.GENERATED_EXAMPLES_FOLDER)
      fs.mkdirSync(constants.GENERATED_EXAMPLES_FOLDER)
    } catch (err) {
      console.log(err)
    }
  }

  if (fields.authentication !== 'none') {
    if (fields.authentication === 'basic') {
      info.authentication = 'Basic'
    } else if (fields.authentication === 'bearer') {
      info.authentication = 'Bearer'
    }
  } else {
    info.authentication = 'None'
  }
  var rootDirectory = process.cwd()
  var examplesFullPath = constants.GENERATED_EXAMPLES_FOLDER

  var configFile = await utils.getConfigFile(fields, files)
  info.conf = new Config()
  info.conf.loadConfigFile(configFile)

  for (var fileIndex in allFiles) {
    var folder = allFiles[fileIndex].replace(path, '')
    var folderParts = folder.split(pathLib.sep)
    var examplePath = examplesFullPath

    for (var part in folderParts) {
      if (folderParts[part]) {
        examplePath += folderParts[part] + pathLib.sep

        if (!fs.existsSync(examplePath)) {
          fs.mkdirSync(examplePath)
        }
      }
    }

    await fileParser.parse(allFiles[fileIndex], rootDirectory, examplePath, host, scheme)
  }

  return examplesFullPath
}

function getAllFiles (path) {
  var files = {
    '.raml': [],
    '.yaml': [],
    '.json': []
  }

  var stat
  try {
    stat = fs.statSync(path)
  } catch (err) {
    reporter.log(err)
    return []
  }

  if (stat && stat.isFile()) {
    return [path]
  }

  recursiveSearch(path, files)

  if (files['.raml'].length === 0) {
    return files['.json'].concat(files['.yaml'])
  }

  return files['.raml']
}

function recursiveSearch (currentDirectory, files) {
  var list = fs.readdirSync(currentDirectory)

  list.forEach(function (file) {
    var fullPath = currentDirectory + pathLib.sep + file
    var stat = fs.statSync(fullPath)

    if (stat && stat.isDirectory()) {
      recursiveSearch(fullPath, files)
    } else {
      for (var extension in files) {
        if (fullPath.endsWith(extension)) {
          files[extension].push(fullPath)
          break
        }
      }
    }
  })
}

module.exports = {
  generateSamples
}
