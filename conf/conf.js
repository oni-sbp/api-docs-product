const yaml = require('js-yaml')
const fs = require('fs')
const debug = require('../reporter').debug
const info = require('../info')

class Config {
  constructor (configData = {}) {
    this.sample_timeout = 5
    this.virtualenv_creation_timeout = 120
    this.virtualenv_name = '.pot-svt-env'
    this.js_project_dir_name = '.pot-node'
    this.substitutions = {}
    this.resp_attr_replacements = {}
    this.always_create_environments = true
    this.debug = false
    this.before_sample = {}
    this.ignore_failures = {}
    this.substitutions_before_sample = {}
    this.operations_order = {}
    this.allow_non_json_responses = {}
    this.ignore_body_examples = false

    for (var key in configData) {
      this[key] = configData[key]
    }
  }

  loadConfigFile (filePath) {
    try {
      var doc = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'))

      for (var key in doc) {
        this[key] = doc[key]
      }
    } catch {
      debug('Config file is missing')
    }

    this.replaceEnvVars()
  }

  replaceEnvVars (raiseError = false) {
    if (!this.substitutions) {
      return
    }

    var missingVariables = new Set([])

    for (var key in this.substitutions) {
      if (typeof (this.substitutions[key]) === 'string' && this.substitutions[key].startsWith('$')) {
        var varName = this.substitutions[key].slice(1)
        var realValue = info.env[varName]

        if (realValue) {
          this.substitutions[key] = realValue
        } else {
          missingVariables.add(varName)
        }
      }
    }

    for (key in this) {
      if (typeof this[key] === 'string' && this[key].startsWith('$')) {
        varName = this[key].slice(1)
        realValue = info.env[varName]

        if (realValue) {
          this[key] = realValue
        } else {
          missingVariables.add(varName)
        }
      }
    }
    missingVariables = Array.from(missingVariables)

    if (missingVariables.length > 0 && raiseError) {
      throw new Error('Failed to find variables in the environment: ' + missingVariables.join(', '))
    }
  }
}

module.exports = {
  Config
}
