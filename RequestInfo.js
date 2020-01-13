const constants = require('./constants')
const fs = require('fs-extra')
const reporter = require('./reporter')
const info = require('./info')
const Guid = require('guid')
const mongoDBManager = require('./mongoDBManager')
const collectionName = 'Generation'

async function getRequest (id) {
  return new Promise((resolve, reject) => {
    var request = new RequestInfo()

    mongoDBManager.getElementById(collectionName, id).then((element) => {
      if (!element) {
        resolve(null)
      } else {
        request.id = element.id
        request.failedTests = element.failedTests
        request.totalTests = element.totalTests
        request.createdDate = element.createdDate
        request.IP = element.IP
        request.generateExamplesTime = element.generateExamplesTime
        request.generateDocsTime = element.generateDocsTime
        request.validationTime = element.validationTime
        request.env = element.env
        request.authentication = element.authentication
        request.conf = JSON.parse(element.conf)
        request.pathToSpecs = element.pathToSpecs
        request.languages = element.languages
        request.apiNames = element.apiNames
        request.type = element.type
        request.stage = element.stage
        request.validate = element.validate
        request.validationLanguages = element.validationLanguages

        resolve(request)
      }
    })
  })
}

async function createRequest (id) {
  return new Promise((resolve, reject) => {
    var request = new RequestInfo()

    if (id) {
      request.id = id
    } else {
      request.id = Guid.create().value
    }

    request.createdDate = getDate()
    request.env = {}
    request.authentication = 'None'

    resolve(request)
  })
}

async function createFalseRequest (id) {
  return new Promise((resolve, reject) => {
    var request = new RequestInfo()
    request.id = id
    resolve(request)
  })
}
class RequestInfo {
  createRequestFolder () {
    try {
      fs.mkdirSync(this.getRequestFolder())
    } catch (err) {
      console.log(err)
      console.log('Could not create request folder')
    }
  }

  getRequestFolder () {
    var fileName = constants.TEMP_FILES_FOLDER + 'request_' + this.id + '/'
    if (info.onWindows) {
      fileName = fileName.replace(/\\/g, '/')
    }

    return fileName
  }

  getGenerationLogFile () {
    return this.getRequestFolder() + constants.GENERATION_LOG_FILE
  }

  getValidationLogFile () {
    return this.getRequestFolder() + constants.VALIDATION_LOG_FILE
  }

  getArchive () {
    return this.getRequestFolder() + constants.ARCHIVE_NAME
  }

  getGeneratedSamplesFolder () {
    var folder = this.getRequestFolder() + constants.GENERATED_EXAMPLES_FOLDER
    try {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
      }
    } catch (err) {
      reporter.logRed(this, 'Could not create Generated examples folder')
      console.log(err)
    }

    return folder
  }

  getDocsPage () {
    return this.getRequestFolder() + constants.DOCS_PAGE
  }

  getDocsBuild () {
    return this.getRequestFolder() + constants.DOCS_BUILD
  }

  getDocsSource () {
    return this.getRequestFolder() + constants.DOCS_SOURCE
  }

  setLanguages (fields) {
    this.languages = ['slate', 'java']

    for (var language in info.acceptedLanguages) {
      if (fields[info.acceptedLanguages[language]] === 'true') {
        this.languages.push(info.acceptedLanguages[language])
      }
    }

    if (this.languages.length === 1) {
      this.languages = info.acceptedLanguages
    }

    this.validationLanguages = this.languages.filter(lang => info.acceptedValidationLanguages.indexOf(lang) !== -1)
  }

  getElementForDB () {
    return {
      id: this.id,
      failedTests: this.failedTests,
      totalTests: this.totalTests,
      createdDate: this.createdDate,
      IP: this.IP,
      generateExamplesTime: this.generateExamplesTime,
      generateDocsTime: this.generateDocsTime,
      validationTime: this.validationTime,
      authentication: this.authentication,
      env: this.env,
      conf: JSON.stringify(this.conf),
      languages: this.languages,
      pathToSpecs: this.pathToSpecs,
      apiNames: this.apiNames,
      type: this.type,
      stage: this.stage,
      validate: this.validate,
      validationLanguages: this.validationLanguages
    }
  }
}

function getDate () {
  const ts = Date.now()

  const dateOb = new Date(ts)
  const date = dateOb.getDate()
  const month = dateOb.getMonth() + 1
  const year = dateOb.getFullYear()
  return year + '-' + month + '-' + date
}

module.exports = {
  RequestInfo,
  createRequest,
  createFalseRequest,
  getRequest
}
