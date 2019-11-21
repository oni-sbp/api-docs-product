const shell = require('shelljs')
const fs = require('fs')
const pathLib = require('path')

function tempFilesFactory (tmpPath, files) {
  for (var fileIndex in files) {
    var file = tmpPath
    if (!file.endsWith(pathLib.sep)) {
      file += pathLib.sep
    }
    file += files[fileIndex]

    var folder = pathLib.dirname(file)

    shell.mkdir('-p', folder)
    fs.writeFileSync(file, '')
  }
}

module.exports = {
  tempFilesFactory
}
