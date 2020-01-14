const formidable = require('formidable')
const fs = require('fs-extra')
const info = require('./info')
const express = require('express')
const app = express()
var port = 80
const generator = require('./generation/code-generator')
const validator = require('./validation/code-validator')
const requestInfo = require('./RequestInfo')
const mongoDBManager = require('./mongoDBManager')
const Guid = require('guid')

app.use(express.static('public'))
app.use(express.json())

app.post('/fileupload', (req, res) => {
  var form = new formidable.IncomingForm()
  form.parse(req, function (err, fields, files) {
    if (err) {
      req.app.locals.errorMessage = 'Form could not be loaded.'
      res.redirect('/ErrorPage')
    }

    var newId = Guid.create().value
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ requestId: newId, origin: req.headers.origin, validate: (fields.validate === 'true') }))
    res.end()

    requestInfo.createRequest(newId).then((request) => {
      info.requestReady[request.id] = false
      info.generationLogPosition[request.id] = 0
      info.validationLogPosition[request.id] = 0

      setImmediate(function () {
        request.createRequestFolder()
        request.IP = req.connection.remoteAddress

        generator.saveFormInfoToRequest(fields, files, request)
      })
    })
  })
})

app.get('/progress', (req, res) => {
  if (info.requestReady[req.query.requestId]) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ ready: true }))
    res.end()
  } else {
    var stage = parseInt(req.query.stage)

    requestInfo.getRequest(req.query.requestId).then((request) => {
      var newLog = ''
      if (request) {
        try {
          var data = fs.readFileSync(request.getGenerationLogFile(), 'utf8')
          if (info.generationLogPosition[request.id] !== data.length) {
            if (info.generationLogPosition[request.id] === 0) {
              newLog += 'Generation:\n'
            }

            newLog += data.slice(info.generationLogPosition[request.id])
            info.generationLogPosition[request.id] = data.length
          }
        } catch (err) {
          console.log('Error: Generation file not ready')
        }

        if (req.query.validate === 'true') {
          try {
            data = fs.readFileSync(request.getValidationLogFile(), 'utf8')
            if (info.validationLogPosition[request.id] !== data.length) {
              if (info.validationLogPosition[request.id] === 0) {
                newLog += '\nValidation:\n'
              }

              newLog += data.slice(info.validationLogPosition[request.id])
              info.validationLogPosition[request.id] = data.length
            }
          } catch (err) {
            console.log('Error: Validation file not ready')
          }
        }

        var content = JSON.stringify({ ready: false, newLog: newLog, stage: request.stage })

        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': content.length })
        res.write(content)
        res.end()
        console.log(info.started[request.id], stage)
        switch (stage) {
          case 0:
            if (!info.started[request.id]) {
              setImmediate(generator.generateSamples, request)
              info.started[request.id] = 1
            }
            break

          case 1:
            if (info.started[request.id] === 1) {
              setImmediate(generator.generateDocs, request)
              info.started[request.id] = 2
            }
            break

          case 2:
            if (info.started[request.id] === 2) {
              setImmediate(generator.generateArchive, request)
              info.started[request.id] = 3
            }
            break

          case 3:
            if (info.started[request.id] === 3) {
              setImmediate(validator.validateGeneratedSamples, request)
              info.started[request.id] = 4
            }
            break
        }
      } else {
        content = JSON.stringify({ ready: false, newLog: '', stage: req.query.stage })

        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': content.length })
        res.write(content)
        res.end()
      }
    })
  }
})

app.get('/readyindex', (req, res) => {
  req.app.locals.requestId = req.query.requestId
  req.app.locals.validate = (req.query.validate === 'true')
  req.app.locals.origin = req.query.origin
  req.app.locals.ready = true

  res.redirect('/')
})

app.get('/', (req, res) => {
  fs.readFile('index.html', function (err, data) {
    if (err) {
      req.app.locals.errorMessage = 'Page not found'
      res.redirect('/ErrorPage')
    }

    if (req.app.locals.ready) {
      req.app.locals.ready = false
      data += '<div id="logs"><center><p style="color: #9073FF;">If you want to see the results later save next link: </p>'
      data += '<p><a href="/results?requestID=' + req.app.locals.requestId + '" class="link">' + req.app.locals.origin + '/results?requestID=' + req.app.locals.requestId + '</a></p>'
      data += '<p><a download href="/generationLogFile?requestID=' + req.app.locals.requestId + '" class="link">Generation Log File</a></p>\n'
      if (req.app.locals.validate) {
        data += '<p><a download href="/validationLogFile?requestID=' + req.app.locals.requestId + '" class="link" onclick="isValidationReady()">Validation Log File</a></p>\n'
      }
      data += '<p style="color: #9073FF;">Generated examples:</p>'
      data += '<p><a download href="/archive?requestID=' + req.app.locals.requestId + '" class="link">Download</a><center>'
      data += '<p><a target="_blank" href="/docsOfTrust?requestID=' + req.app.locals.requestId + '" class="link">View</a></center><div>\n'
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
  requestInfo.getRequest(req.query.requestID).then((request) => {
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
