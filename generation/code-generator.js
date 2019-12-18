const fs = require('fs-extra')
const info = require('../info')
const fileParser = require('./file-parser')
const pathLib = require('path')
const utils = require('../utils')
const Config = require('../conf/conf').Config
const runShellCommand = require('../validation/utils').runShellCommand

async function generateSamples (fields, files, request) {
  const firstTimerStart = Date.now()
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

  if (allFiles[0].endsWith('.raml')) {
    request.type = 'raml'
  } else {
    request.type = 'swagger'
  }

  var host = fields.host
  var scheme = fields.scheme

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
  var rootDirectory = process.cwd()
  var examplesFullPath = request.getGeneratedSamplesFolder()

  var configFile = await utils.getConfigFile(fields, files, request)
  request.conf = new Config()
  request.conf.loadConfigFile(request, configFile)
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

    apiNames.push(await fileParser.parse(allFiles[fileIndex], rootDirectory, examplePath, host, scheme, request))
  }

  const firstTimerEnd = Date.now()
  request.generateExamplesTime = ((firstTimerEnd - firstTimerStart) / 1000).toString() + ' s'
  const secondTimerStart = Date.now()
  generateDocs(request, allFiles, apiNames, path)
  const secondTimerEnd = Date.now()
  request.generateDocsTime = ((secondTimerEnd - secondTimerStart) / 1000).toString() + ' s'
  return examplesFullPath
}

function generateDocs (request, allFiles, apiNames, path) {
  var examplesFullPath = request.getGeneratedSamplesFolder()

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

      break
    }
  }
}

function generateDocsForFile (request, path, apiName, examplesPath) {
  path = path.replace(/\\/g, '/')
  if (info.onWindows) {
    var arg = 'python build.py --type ' + request.type + ' --path "' + path + '" --apiname "' + apiName + '" --requestfolder "' + request.getRequestFolder() + '" --examples "' + examplesPath + '"'

    runShellCommand('mkdir "' + request.getDocsBuild() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getDocsSource() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'slate/"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'OAS/"', 20, process.cwd())

    runShellCommand('XCOPY /E .\\docs\\source "' + request.getDocsSource() + '"', 20, process.cwd())

    runShellCommand(arg, 20, process.cwd() + '/docs/raml2markdown')
    runShellCommand('bundle exec middleman build --source "' + request.getDocsSource().replace(process.cwd().replace(/\\/g, '/'), '..') + '" --build-dir "' + request.getDocsBuild() + '"', 20, process.cwd() + '/docs')
  } else {
    arg = 'python3 build.py --type ' + request.type + ' --path "' + path + '" --apiname "' + apiName + '" --requestfolder "' + request.getRequestFolder() + '" --examples "' + examplesPath + '"'

    runShellCommand('mkdir "' + request.getDocsBuild() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getDocsSource() + '"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'slate/"', 20, process.cwd())
    runShellCommand('mkdir "' + request.getRequestFolder() + 'OAS/"', 20, process.cwd())

    runShellCommand('cp -r ./docs/source "' + request.getRequestFolder() + '"', 20, process.cwd());

    runShellCommand(arg, 20, process.cwd() + '/docs/raml2markdown')
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
  generateSamples
}
