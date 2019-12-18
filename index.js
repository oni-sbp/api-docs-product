const formidable = require('formidable')
const fs = require('fs-extra')
const archiver = require('archiver')
const info = require('./info')
const express = require('express')
const app = express()
var port = 80
const validator = require('./validation/code-validator')
const generator = require('./generation/code-generator')
const requestInfo = require('./RequestInfo')
const mongoDBManager = require('./mongoDBManager')

var fileReady = {}

app.use(express.static('public'))

app.post('/fileupload', (req, res) => {
  var form = new formidable.IncomingForm()

  form.parse(req, function (err, fields, files) {
    if (err) {
      req.app.locals.errorMessage = 'Form could not be loaded.'
      res.redirect('/ErrorPage')
    }

    requestInfo.createRequest().then((request) => {
      request.createRequestFolder()
      request.IP = req.connection.remoteAddress

      request.logFileStream = fs.createWriteStream(request.getGenerationLogFile(), { flags: 'w' })

      generator.generateSamples(fields, files, request).then((samplesPath) => {
        if (samplesPath === '') {
          req.app.locals.errorMessage = 'API specification not found'
          res.redirect('/ErrorPage')
        } else {
          request.logFileStream = fs.createWriteStream(request.getValidationLogFile(), { flags: 'w' })
          fields.samplespath = samplesPath

          var archive = archiver('zip')
          archive.directory(samplesPath, 'samples')

          var archiveFile = fs.createWriteStream(request.getArchive(), { flags: 'w' })
          archive.pipe(archiveFile)
          archive.finalize()

          if (fields.validate === 'on') {
            // fileReady[validationLogFile] = false
          }
          validator.validateGeneratedSamples(fields, files, request).then(() => {
            const newElement = {
              id: request.id,
              failedTests: request.failedTests,
              totalTests: request.totalTests,
              createdDate: request.createdDate,
              IP: request.IP,
              generateExamplesTime: request.generateExamplesTime,
              generateDocsTime: request.generateDocsTime,
              validationTime: request.validationTime
            }

            mongoDBManager.insertOne('Generation', newElement)

            fs.readFile('index.html', function (err, data) {
              if (!err) {
                res.writeHead(200, { 'Content-Type': 'text/html' })

                data += '<div id="logs"><center><p style="color: #9073FF;">If you want to see the results later save next link: </p>'
                data += '<p><a href="/results?requestID=' + request.id + '" class="link">' + req.headers.origin + '/results?requestID=' + request.id + '</a></p>'
                data += '<p><a download href="/generationLogFile?requestID=' + request.id + '" class="link">Generation Log File</a></p>\n'
                if (fields.validate === 'on') {
                  data += '<p><a download href="/validationLogFile?requestID=' + request.id + '" class="link" onclick="isValidationReady()">Validation Log File</a></p>\n'
                }
                data += '<p style="color: #9073FF;">Generated examples:</p>'
                data += '<p><a download href="/archive?requestID=' + request.id + '" class="link">Download</a><center>'
                data += '<p><a target="_blank" href="/docsOfTrust?requestID=' + request.id + '" class="link">View</a></center><div>\n'

                res.write(data)
              }

              res.end()
            })

            fileReady[request.getValidationLogFile()] = true
          })
        }
      })
    })
  })
})

app.get('/', (req, res) => {
  fs.readFile('index.html', function (err, data) {
    if (err) {
      req.app.locals.errorMessage = 'Page not found'
      res.redirect('/ErrorPage')
    }

    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length })
    res.write(data)
    res.end()
  })
})

app.get('/ErrorPage', (req, res) => {
  var content = '<h2> ' + req.app.locals.errorMessage + '</h2>'
  res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': content.length })
  res.write(content)
  res.end()
})

app.route('/Statistics')
  .get(function (req, res) {
    mongoDBManager.getStatistics().then((stats) => {
      var TryCount = stats.TryCount
      var SuccessCount = stats.SuccessCount
      var FailedCount = stats.FailedCount

      fs.readFile('statistics.html', function (err, data) {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'text/html' })

          data = data.toString().replace('[TryCountValue]', TryCount)
          data = data.toString().replace('[SuccessCountValue]', SuccessCount)
          data = data.toString().replace('[FailedCountValue]', FailedCount)
          data = data.toString().replace('[ValidationsValue]', FailedCount + SuccessCount)
          SuccessCount = 0
          FailedCount = 0
          res.write(data)
        }

        res.end()
      })
    })
  })

app.get('/generationLogFile', (req, res) => {
  requestInfo.createRequest(req.query.requestID).then((request) => {
    if (!request) {
      req.app.locals.errorMessage = 'Log file does not exist.'
      res.redirect('/ErrorPage')
    } else {
      fs.readFile(request.getGenerationLogFile(), function (err, data) {
        if (!err && data) {
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': data.length,
            'Content-Disposition': 'attachment; filename="generation.txt"'
          })
          res.write(data)
          res.end()
        } else {
          req.app.locals.errorMessage = 'Log file does not exist.'
          res.redirect('/ErrorPage')
        }
      })
    }
  })
})

app.get('/validationLogFile', (req, res) => {
  requestInfo.createRequest(req.query.requestID).then((request) => {
    if (!request) {
      req.app.locals.errorMessage = 'Log file does not exist.'
      res.redirect('/ErrorPage')
    } else {
      fs.readFile(request.getValidationLogFile(), function (err, data) {
        if (!err && data) {
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': data.length,
            'Content-Disposition': 'attachment; filename="validation.txt"'
          })
          res.write(data)
          res.end()
        } else {
          req.app.locals.errorMessage = 'Log file does not exist.'
          res.redirect('/ErrorPage')
        }
      })
    }
  })
})

app.get('/archive', (req, res) => {
  requestInfo.createRequest(req.query.requestID).then((request) => {
    if (!request) {
      req.app.locals.errorMessage = 'Archive does not exist.'
      res.redirect('/ErrorPage')
    } else {
      fs.readFile(request.getArchive(), function (err, data) {
        if (!err && data) {
          res.header('Content-Type', 'application/zip')
          res.header('Content-Disposition', 'attachment; filename="samples.zip"')
          res.write(data)
          res.end()
        } else {
          req.app.locals.errorMessage = 'Archive does not exist.'
          res.redirect('/ErrorPage')
        }
      })
    }
  })
})

app.get('/readyLogFile', (req, res) => {
  console.log(req)

  // res.send({ready: readFile[req.]});
})

app.get('/docsOfTrust', (req, res) => {
  requestInfo.createRequest(req.query.requestID).then((request) => {
    if (!request) {
      req.app.locals.errorMessage = 'Page not found'
      res.redirect('/ErrorPage')
    } else {
      fs.readFile(request.getDocsPage(), function (err, data) {
        if (err) {
          req.app.locals.errorMessage = 'Page not found'
          res.redirect('/ErrorPage')
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length })
          res.write(data)
          res.end()
        }
      })
    }
  })
})

app.get('/results', (req, res) => {
  requestInfo.createRequest(req.query.requestID).then((request) => {
    if (!request) {
      req.app.locals.errorMessage = 'Page not found'
      res.redirect('/ErrorPage')
    } else {
      fs.readFile('results.html', function (err, data) {
        if (err) {
          req.app.locals.errorMessage = 'Page not found'
          res.redirect('/ErrorPage')
        } else {
          data = data.toString().replace(/\[REQUEST_ID\]/g, req.query.requestID)
          if (request.totalTests === 0) {
            data = data.toString().replace('[VALIDATION]', 'none')
          } else {
            data = data.toString().replace('[VALIDATION]', 'block')
          }

          if (request) { res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length }) }
          res.write(data)
          res.end()
        }
      })
    }
  })
})

if (info.onWindows) {
  port = 8081
}

app.listen(port)
