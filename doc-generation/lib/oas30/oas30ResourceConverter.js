'use strict'

var _slicedToArray = (function () { function sliceIterator (arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break } } catch (err) { _d = true; _e = err } finally { try { if (!_n && _i.return) _i.return() } finally { if (_d) throw _e } } return _arr } return function (arr, i) { if (Array.isArray(arr)) { return arr } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i) } else { throw new TypeError('Invalid attempt to destructure non-iterable instance') } } }())

var _createClass = (function () { function defineProperties (target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor) } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor } }())

function _classCallCheck (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function') } }

function _possibleConstructorReturn (self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called") } return call && (typeof call === 'object' || typeof call === 'function') ? call : self }

function _inherits (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass) } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass }

var _ = require('lodash')

var ConverterModel = require('oas-raml-converter-model')
var Resource = ConverterModel.Resource
var Root = ConverterModel.Root
var Method = ConverterModel.Method
var Definition = ConverterModel.Definition
var Parameter = ConverterModel.Parameter
var Converter = require('../converters/converter')
var helper = require('../helpers/converter')

var Oas30DefinitionConverter = require('./oas30DefinitionConverter')
var Oas30MethodConverter = require('./oas30MethodConverter')
var Oas30RootConverter = require('./oas30RootConverter')

var OasParameter = require('./oas30Types').Parameter

var Oas30ResourceConverter = (function (_Converter) {
  _inherits(Oas30ResourceConverter, _Converter)

  function Oas30ResourceConverter (model, dereferencedAPI, def) {
    _classCallCheck(this, Oas30ResourceConverter)

    var _this = _possibleConstructorReturn(this, (Oas30ResourceConverter.__proto__ || Object.getPrototypeOf(Oas30ResourceConverter)).call(this, model, '', def))

    _this.dereferencedAPI = dereferencedAPI
    return _this
  }

  _createClass(Oas30ResourceConverter, [{
    key: 'export',
    value: function _export (models) {
      var result = {}
      if (!models || _.isEmpty(models)) return result

      for (var i = 0; i < models.length; i++) {
        var model = models[i]
        var parents = Oas30ResourceConverter.getParents(model.path, models)
        if (!_.isEmpty(parents)) {
          var parent = parents[0]
          var parameters = model.parameters ? model.parameters : []
          var modelParameters = parameters.map(function (parameter) {
            return parameter.name
          })
          if (parent.parameters != null) {
            var parentParams = parent.parameters
            for (var j = 0; j < parentParams.length; j++) {
              var parameter = parentParams[j]
              if (!modelParameters.includes(parameter.name)) {
                parameters.push(parameter)
                model.parameters = parameters
              }
            }
          }
        }
        var oasDef = this._export(model)
        var hasNestedResources = false
        for (var _i = 0; _i < models.length; _i++) {
          var resource = models[_i]
          if (!hasNestedResources && resource.path && model.path) hasNestedResources = resource.path.startsWith(model.path) && resource.path !== model.path
        }
        var hasOnlyUriParams = oasDef.parameters != null && oasDef.parameters.filter(function (param) {
          return param.in !== 'path'
        }).length === 0
        var ignore = hasNestedResources && _.keys(oasDef).length === 1 && hasOnlyUriParams
        if ((!(_.isEmpty(oasDef) || ignore) || model.securedBy != null) && model.path != null) {
          result[model.path] = oasDef
        }
      }

      return result
    }

    // exports 1 resource definition

  }, {
    key: '_export',
    value: function _export (model) {
      var attrIdMap = {}

      var attrIdSkip = ['path', 'relativePath', 'resourceType', 'description', 'displayName', 'methods', 'resources', 'parameters', 'is', 'securedBy', 'annotations']
      var oasDef = Oas30ResourceConverter.createOasDef(model, attrIdMap, attrIdSkip)
      var definitionConverter = new Oas30DefinitionConverter()

      if (model.methods != null) {
        var methodsModel = model.methods
        if (_.isArray(methodsModel) && !_.isEmpty(methodsModel)) {
          var methodConverter = new Oas30MethodConverter(this.model, null, model.path, this.def)
          var methods = methodConverter.export(methodsModel)
          for (var id in methods) {
            if (!methods.hasOwnProperty(id)) continue

            oasDef[id] = methods[id]
          }
        }
      }

      if (model.parameters != null) {
        var paramsModel = model.parameters
        if (_.isArray(paramsModel) && !_.isEmpty(paramsModel)) {
          var parameters = []
          for (var i = 0; i < paramsModel.length; i++) {
            var value = paramsModel[i]
            if (model.path != null && !model.path.includes(value.name) || value.definition == null) continue
            var definition = value.definition
            // $ExpectError _in is not precise enough
            var parameter = new OasParameter(value.name, value._in || 'query', value.required || false)
            parameter.schema = Object.assign({}, definitionConverter._export(definition))
            if (parameter.description == null && value.displayName != null) parameter.description = value.displayName
            if (parameter.schema.required != null) {
              parameter.required = parameter.schema.required
              delete parameter.schema.required
            }
            // path vars are always required
            if (value._in === 'path') {
              parameter.required = true
            }
            if (parameter.schema.type == null && !parameter.schema.$ref) parameter.schema.type = 'string'
            if (parameter.$ref != null) delete parameter.$ref
            if (parameter.schema.type === 'array' && parameter.schema.items == null) parameter.schema.items = { type: 'string' }
            if (parameter.schema.description) {
              parameter.description = parameter.schema.description
              delete parameter.schema.description
            }
            helper.removePropertiesFromObject(parameter, ['example'])
            Oas30RootConverter.exportAnnotations(value, parameter)
            parameters.push(parameter)
          }
          oasDef.parameters = parameters
        }
      }

      Oas30RootConverter.exportAnnotations(model, oasDef)

      return oasDef
    }
  }], [{
    key: 'getParents',
    value: function getParents (path, models) {
      var parentAbsolutePath = Oas30ResourceConverter.getParentAbsolutePath(path)
      var parents = models.filter(function (model) {
        return model.path === parentAbsolutePath
      })
      if (!_.isEmpty(parentAbsolutePath)) parents = parents.concat(Oas30ResourceConverter.getParents(parentAbsolutePath, models))

      return parents
    }
  }, {
    key: 'createOasDef',
    value: function createOasDef (resource, attrIdMap, attrIdSkip) {
      var result = {}

      _.assign(result, resource)
      attrIdSkip.map(function (id) {
        delete result[id]
      })
      _.keys(attrIdMap).map(function (id) {
        var value = result[id]
        if (value !== undefined) {
          result[attrIdMap[id]] = result[id]
          delete result[id]
        }
      })

      return result
    }
  }, {
    key: 'createResource',
    value: function createResource (oasDef, attrIdMap, attrIdSkip, annotationPrefix) {
      var object = {}

      _.entries(oasDef).map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2)
				    var key = _ref2[0]
				    var value = _ref2[1]

        if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-') && !key.startsWith(annotationPrefix)) {
          object[attrIdMap[key] != null ? attrIdMap[key] : key] = value
        }
      })
      var result = new Resource()
      _.assign(result, object)

      return result
    }
  }, {
    key: 'getParentPath',
    value: function getParentPath (path) {
      if (!path) return ''
      var absoluteParent = path.substring(0, path.lastIndexOf('/'))
      return Oas30ResourceConverter.getRelativePath(absoluteParent)
    }
  }, {
    key: 'getParentAbsolutePath',
    value: function getParentAbsolutePath (path) {
      if (!path) return ''
      var parentPath = Oas30ResourceConverter.getParentPath(path)
      return path.substring(0, path.indexOf(parentPath)) + parentPath
    }
  }, {
    key: 'getRelativePath',
    value: function getRelativePath (path) {
      return path.substring(path.lastIndexOf('/'))
    }
  }])

  return Oas30ResourceConverter
}(Converter))

module.exports = Oas30ResourceConverter
