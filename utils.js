const pathLib = require('path')
const fs = require('fs-extra')
const https = require('https')
const http = require('http')
const constants = require('./constants')
const Guid = require('guid')
const reporter = require('./reporter.js')
const unzipper = require('unzipper')

async function createTempSourceFileFromFile (file) {
  var inputFileName = file.path

  if (file.name.endsWith('.zip')) {
    var extractToDirectory = constants.TEMP_FILES_FOLDER + 'Archive_' + Guid.create()

    try {
      fs.mkdirSync(extractToDirectory)

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          try {
            fs.remove(extractToDirectory)
          } catch (error) {
            console.log(error)
          }
        }, 3600000)

        fs.createReadStream(inputFileName)
          .pipe(unzipper.Extract({ path: extractToDirectory })).on('close', () => {
            resolve(extractToDirectory)
          })
      })
    } catch (error) {
      console.log(error)

      return new Promise(function (resolve, reject) {
        resolve('')
      })
    }
  } else {
    var folderPath = constants.TEMP_FILES_FOLDER + 'File_' + Guid.create() + pathLib.sep
    var filePath = folderPath + pathLib.basename(file.name)
    fs.mkdirSync(folderPath)
    var writeStream = fs.createWriteStream(filePath)

    return new Promise(function (resolve, reject) {
      try {
        fs.createReadStream(inputFileName).pipe(writeStream).on('close', () => {
          resolve(filePath)
        })
      } catch (error) {
        resolve('')
      }
    })
  }
}

async function createTempSourceFileFromUrl (url) {
  var parts = url.split('/')
  var name = parts[parts.length - 1]
  if (name === '') {
    name = parts[parts.length - 2]
  }
  var folderPath = constants.TEMP_FILES_FOLDER + 'Temp_File_' + Guid.create() + pathLib.sep
  var filePath = folderPath + name
  fs.mkdirSync(folderPath)
  var writeStream = fs.createWriteStream(filePath)

  return new Promise(function (resolve, reject) {
    try {
      if (url.startsWith('https')) {
        https.get(url, function (response) {
          response.pipe(writeStream).on('close', () => {
            resolve(createTempSourceFileFromFile({ path: filePath, name: name }))
          })
        })
      } else {
        http.get(url, function (response) {
          response.pipe(writeStream).on('close', () => {
            resolve(createTempSourceFileFromFile({ path: filePath, name: name }))
          })
        })
      }
    } catch (error) {
      console.log(error)

      resolve('')
    }
  })
}

async function getConfigFile (fields, files, request) {
  var configFile = 'validation/conf.yaml'
  if (files.config.size > 0) {
    if (files.config.name.endsWith('.yaml')) {
      configFile = await this.createTempSourceFileFromFile(files.config)
    } else {
      reporter.log(request, 'Configuration file is not a yaml file')
    }
  } else if (fields.config_url) {
    configFile = await this.createTempSourceFileFromUrl(fields.config_url)
  }

  return configFile
}

module.exports = {
  createTempSourceFileFromFile,
  createTempSourceFileFromUrl,
  getConfigFile
}
