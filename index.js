const formidable = require('formidable')
const fs = require('fs-extra')
const archiver = require('archiver')
const info = require('./info')
const express = require('express')
const app = express()
const port = 8080
const validator = require('./validation/code-validator')
const Guid = require('guid')
const generator = require('./generation/code-generator')
const constants = require('./constants')

var fileReady = {};

try {
  fs.remove(constants.ARCHIVES_FOLDER).then(() => {
    fs.mkdir(constants.ARCHIVES_FOLDER).catch((err) => {
      console.log(err)
    })
  })
} catch (err) {
  console.log(err)
}

try {
  fs.remove(constants.LOG_FILES_FOLDER).then(() => {
    fs.mkdir(constants.LOG_FILES_FOLDER).catch((err) => {
      console.log(err)
    })
  })
} catch (err) {
  console.log(err)
}

try {
  fs.remove(constants.TEMP_FILES_FOLDER).then(() => {
    fs.mkdir(constants.TEMP_FILES_FOLDER).catch((err) => {
      console.log(err)
    })
  })
} catch (err) {
  console.log(err)
}
app.use(express.static('public'))

app.post('/fileupload', (req, res) => {
  var form = new formidable.IncomingForm()

  form.parse(req, function (err, fields, files) {
    if (err) {
      req.app.locals.errorMessage = 'Form could not be loaded.'
      res.redirect('/ErrorPage')
    }

    var logFileName = 'log_' + Guid.create() + '.txt'
    info.logFileStream = fs.createWriteStream(constants.LOG_FILES_FOLDER + logFileName, { flags: 'w' })

    generator.generateSamples(fields, files).then((samplesPath) => {
      if (samplesPath === '') {
        req.app.locals.errorMessage = 'API specification not found'
        res.redirect('/ErrorPage')
      } else {
        var validationLogFile = 'log_' + Guid.create() + '.txt'
        info.logFileStream = fs.createWriteStream(constants.LOG_FILES_FOLDER + validationLogFile, { flags: 'w' })
        fields.samplespath = samplesPath

        var archive = archiver('zip')
        archive.directory(samplesPath, 'samples')

        var archiveFileName = 'archive_' + Guid.create() + '.zip'
        var archiveFile = fs.createWriteStream(constants.ARCHIVES_FOLDER + archiveFileName, { flags: 'w' })
        archive.pipe(archiveFile)
        archive.finalize()

        

        if (fields.validate === 'on') {
          fileReady[validationLogFile] = false;
        }

        validator.validateGeneratedSamples(fields, files).then(() => {
          fileReady[validationLogFile] = true;

          archiveFile.on('close', () => {
            fs.removeSync(samplesPath)
          })

          fs.readFile('index.html', function (err, data) {
            if (!err) {
              data += '<p><a download href="/logfile?logfile=' + logFileName + '">Generation Log File</a></p>\n'
              if (fields.validate === 'on') {
                data += '<p><a download href="/logfile?logfile=' + validationLogFile + '" onclick="isValidationReady()">Validation Log File</a></p>\n'
              }
              data += '<p><a download href="/archive?archive=' + archiveFileName + '">Archive with generated samples</a></p>\n'
  
              res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length })
              res.write(data)
            }
  
            res.write(data)
            res.end()
          })

          setTimeout(function () {
            try {
              fs.remove(constants.ARCHIVES_FOLDER + archiveFileName)
              fs.remove(constants.LOG_FILES_FOLDER + logFileName)
              fs.remove(constants.LOG_FILES_FOLDER + validationLogFile)
            } catch (error) {
              console.log(error)
            }
          }, 3600000)
        })
      }
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

app.get('/logfile', (req, res) => {
  fs.readFile(constants.LOG_FILES_FOLDER + req.query.logfile, function (err, data) {
    if (!err && data) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': data.length,
        'Content-Disposition': 'attachment; filename="log.txt"'
      })
      res.write(data)
      res.end()
    } else {
      req.app.locals.errorMessage = 'Log file does not exist.'
      res.redirect('/ErrorPage')
    }
  })
})

app.get('/ErrorPage', (req, res) => {
  var content = '<h2> ' + req.app.locals.errorMessage + '</h2>'
  res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': content.length })
  res.write(content)
  res.end()
})

app.get('/archive', (req, res) => {
  fs.readFile(constants.ARCHIVES_FOLDER + req.query.archive, function (err, data) {
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
})

app.post('/samplesforvalidation', (req, res) => {
  var form = new formidable.IncomingForm()
  form.parse(req, function (err, fields, files) {
    if (err) {
      req.app.locals.errorMessage = 'Form could not be loaded.'
      res.redirect('/ErrorPage')
    }

    var logFileName = 'log_' + Guid.create() + '.txt'
    info.logFileStream = fs.createWriteStream(constants.LOG_FILES_FOLDER + logFileName, { flags: 'w' })

    validator.validateGeneratedSamples(fields).then(() => {
      fs.readFile('validation.html', function (err, data) {
        if (!err) {
          data += '<p><a download href="/logfile?logfile=' + logFileName + '">Log File</a></p>\n'
          res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length })
          res.write(data)
        }

        res.end()
      })
    })

    setTimeout(function () {
      try {
        fs.remove(constants.LOG_FILES_FOLDER + logFileName)
      } catch (error) {
        console.log(error)
      }
    }, 3600000)
  })
})

app.get('/validation', (req, res) => {
  fs.readFile('validation.html', function (err, data) {
    if (err) {
      req.app.locals.errorMessage = 'Page not found'
      res.redirect('/ErrorPage')
    }

    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length })
    res.write(data)
    res.end()
  })
})

app.get('/readyLogFile', (req, res) => {
  console.log(req);

  //res.send({ready: readFile[req.]});
})

app.listen(port)
