const fs = require('fs-extra')
const info = require('../info')
const fileParser = require('./file-parser')
const pathLib = require('path')
const utils = require('../utils')
const Config = require('../conf/conf').Config
const runShellCommand = require('../validation/utils').runShellCommand
const archiver = require('archiver')
const reporter = require('../reporter')
const mongoDBManager = require('../mongoDBManager')

async function saveFormInfoToRequest (fields, files, request) {
  return new Promise(function (resolve, reject) {
    request.setLanguages(fields)

    if (fields.authentication !== 'none') {
      if (fields.authentication === 'basic') {
        request.authentication = 'Basic'
      } else if (fields.authentication === 'bearer') {
        request.authentication = 'Bearer'
      }
    } else {
      request.authentication = 'None'
    }

    var host = fields.host
    request.scheme = fields.scheme
    request.host = host

    if (host !== '') {
      request.env.TESTING_API_URL = host
    }
    request.env.AUTH_TOKEN = fields.auth_token

    request.keyword = fields.keyword
    request.validate = (fields.validate === 'true')

    request.stage = 0

    utils.getConfigFile(fields, files, request).then((configFile) => {
      request.conf = new Config()
      request.conf.loadConfigFile(request, configFile)

      if (files.file && files.file.size !== 0) {
        // I received a file or archive
        utils.createTempSourceFileFromFile(files.file).then((path) => {
          request.pathToSpecs = path
          mongoDBManager.insertOne('Generation', request.getElementForDB())

          resolve()
        })
      } else {
        // I received an URL
        utils.createTempSourceFileFromUrl(fields.url).then((path) => {
          request.pathToSpecs = path
          mongoDBManager.insertOne('Generation', request.getElementForDB())

          resolve()
        })
      }
    })
  })
}

async function generateSamples (request) {
  request.logFileStream = fs.createWriteStream(request.getGenerationLogFile(), { flags: 'w' })
  const firstTimerStart = Date.now()
  var path = request.pathToSpecs

  var allFiles = getAllFiles(path)

  if (allFiles.length === 0) {
    return ''
  }

  if (allFiles[0].endsWith('.raml')) {
    request.type = 'raml'
  } else {
    request.type = 'swagger'
  }

  var rootDirectory = process.cwd()
  var examplesFullPath = request.getGeneratedSamplesFolder()

  var apiNames = []

  for (var fileIndex in allFiles) {
    var folder = allFiles[fileIndex].replace(path, '')
    var folderParts = folder.split(pathLib.sep)
    var examplePath = examplesFullPath

    for (var part in folderParts) {
      if (folderParts[part]) {
        examplePath += folderParts[part] + '/'

        if (!fs.existsSync(examplePath)) {
          fs.mkdirSync(examplePath)
        }
      }
    }

    apiNames.push(await fileParser.parse(allFiles[fileIndex], rootDirectory, examplePath, request))
  }

  const firstTimerEnd = Date.now()
  request.generateExamplesTime = ((firstTimerEnd - firstTimerStart) / 1000).toString() + 's'
  request.apiNames = apiNames

  mongoDBManager.updateOne('Generation', request.id, { generateExamplesTime: request.generateExamplesTime, apiNames: request.apiNames, type: request.type, stage: 1 })
}

function generateArchive (request) {
  request.logFileStream = fs.createWriteStream(request.getGenerationLogFile(), { flags: 'a' })
  reporter.log(request, 'Generating archive')

  var archive = archiver('zip')
  archive.directory(request.getGeneratedSamplesFolder(), 'samples')

  var archiveFile = fs.createWriteStream(request.getArchive(), { flags: 'w' })
  archive.pipe(archiveFile)
  archive.finalize()

  mongoDBManager.updateOne('Generation', request.id, { stage: 3 })
}

function generateDocs (request) {
  const secondTimerStart = Date.now()
  request.logFileStream = fs.createWriteStream(request.getGenerationLogFile(), { flags: 'a' })
  reporter.log(request, 'Generating docs page')

  var examplesFullPath = request.getGeneratedSamplesFolder()
  var path = request.pathToSpecs
  var allFiles = getAllFiles(path)
  var apiNames = request.apiNames

  initiateDocsGeneration(request)

  for (var fileIndex in allFiles) {
    if (apiNames[fileIndex]) {
      var folder = allFiles[fileIndex].replace(path, '')
      var folderParts = folder.split(pathLib.sep)
      var examplePath = examplesFullPath

      for (var part in folderParts) {
        if (folderParts[part]) {
          examplePath += folderParts[part] + '/'
        }
      }

      generateDocsForFile(request, allFiles[fileIndex], apiNames[fileIndex], examplePath)
    }
  }

  concatenateSlates(request)
  generateIndexHtml(request)

  request.logFileStream.end()
  const secondTimerEnd = Date.now()
  request.generateDocsTime = ((secondTimerEnd - secondTimerStart) / 1000).toString() + 's'

  mongoDBManager.updateOne('Generation', request.id, { generateDocsTime: request.generateDocsTime, stage: 2 })
}

function generateDocsForFile (request, path, apiName, examplesPath) {
  path = path.replace(/\\/g, '/')
  if (info.onWindows) {
    var arg_build = 'python build.py --type ' + request.type + ' --path "' + path + '" --apiname "' + apiName + '" --requestfolder "' + request.getRequestFolder() + '" --examples "' + examplesPath + '"'
    runShellCommand(arg_build, 20, process.cwd() + '/docs/raml2markdown')
  } else {
    arg_build = 'python3 build.py --type ' + request.type + ' --path "' + path + '" --apiname "' + apiName + '" --requestfolder "' + request.getRequestFolder() + '" --examples "' + examplesPath + '"'
    runShellCommand(arg_build, 20, process.cwd() + '/docs/raml2markdown')
  }
}

function initiateDocsGeneration (request) {
  if (info.onWindows) {
    runShellCommand('mkdir "' + request.getDocsBuild() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getDocsSource() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'slate/"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'OAS/"', 20, process.cwd())

    runShellCommand('XCOPY /E .\\docs\\source "' + request.getDocsSource() + '"', 20, process.cwd())
  } else {
    runShellCommand('mkdir "' + request.getDocsBuild() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getDocsSource() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'slate/"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'OAS/"', 20, process.cwd())

    runShellCommand('cp -r ./docs/source "' + request.getRequestFolder() + '"', 20, process.cwd())
  }
}

function concatenateSlates(request) {
  if (info.onWindows) {
    var arg_concatenate = 'python concatenate.py --requestfolder ' + request.getRequestFolder()
    runShellCommand(arg_concatenate, 20, process.cwd() + '/docs/raml2markdown')
  } else {
    arg_concatenate = 'python3 concatenate.py --requestfolder ' + request.getRequestFolder()
    runShellCommand(arg_concatenate, 20, process.cwd() + '/docs/raml2markdown')
  }
}

function generateIndexHtml(request) {
  if (info.onWindows) {
    runShellCommand('bundle exec middleman build --source "' + request.getDocsSource().replace(process.cwd().replace(/\\/g, '/'), '..') + '" --build-dir "' + request.getDocsBuild() + '"', 20, process.cwd() + '/docs')
  } else {
    runShellCommand('export PATH="/usr/share/rvm/gems/ruby-2.4.2/bin:/usr/share/rvm/gems/ruby-2.4.2@global/bin:/usr/share/rvm/rubies/ruby-2.4.2/bin:$PATH" && bundle exec middleman build --source "' + request.getDocsSource().replace(process.cwd().replace(/\\/g, '/'), '..') + '" --build-dir "' + request.getDocsBuild() + '"', 20, process.cwd() + '/docs')
  }
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
    console.log(err)
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
  generateSamples,
  generateDocs,
  generateArchive,
  saveFormInfoToRequest
}
