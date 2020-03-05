'use strict'

var _createClass = (function () { function defineProperties (target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor) } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor } }())

function _defineProperty (obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }) } else { obj[key] = value } return obj }

function _classCallCheck (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function') } }

function _possibleConstructorReturn (self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called") } return call && (typeof call === 'object' || typeof call === 'function') ? call : self }

function _inherits (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass) } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass }

var _ = require('lodash')

var ConverterModel = require('oas-raml-converter-model')
var Converter = require('../converters/converter')
var Root = ConverterModel.Root
var Method = ConverterModel.Method
var Response = ConverterModel.Response
var Body = ConverterModel.Body
var Header = ConverterModel.Header
var Definition = ConverterModel.Definition
var Parameter = ConverterModel.Parameter
// const MediaType = ConverterModel.mediaType');
var SecurityRequirement = ConverterModel.SecurityRequirement

var ParameterConverter = require('../common/parameterConverter')
var helper = require('../helpers/converter')
var stringsHelper = require('../utils/strings')

var Oas30RootConverter = require('./oas30RootConverter')
var Oas30DefinitionConverter = require('./oas30DefinitionConverter')

var _require = require('./oas30Types')
var Operation = _require.Operation
var Reference = _require.Reference
var RequestBody = _require.RequestBody

var OasResponse = require('./oas30Types').Response
var OasParameter = require('./oas30Types').Parameter
var OasMediaType = require('./oas30Types').MediaType
var OasHeader = require('./oas30Types').Header

var Oas30MethodConverter = (function (_Converter) {
  _inherits(Oas30MethodConverter, _Converter)

  function Oas30MethodConverter (model, dereferencedAPI, resourcePath, def) {
    _classCallCheck(this, Oas30MethodConverter)

    var _this = _possibleConstructorReturn(this, (Oas30MethodConverter.__proto__ || Object.getPrototypeOf(Oas30MethodConverter)).call(this, model, '', def))

    _this.dereferencedAPI = dereferencedAPI
    _this.resourcePath = resourcePath
    return _this
  }

  _createClass(Oas30MethodConverter, [{
    key: 'export',
    value: function _export (models) {
      var result = {}
      if (_.isEmpty(models)) return result

      for (var i = 0; i < models.length; i++) {
        var model = models[i]
        result[model.method] = this._export(model)
      }

      return result
    }
  }, {
    key: '_export',
    value: function _export (model) {
      var operation = new Operation()
      operation.description = model.description
      operation.tags = model.tags

      var definitionConverter = new Oas30DefinitionConverter(this.model, this.annotationPrefix, this.def)

      operation.operationId = model.name
      if (operation.operationId == null) operation.operationId = stringsHelper.computeOperationId(model.method, model.path)

      if (model.responses != null) {
        var responsesModel = model.responses
        if (Array.isArray(responsesModel) && !_.isEmpty(responsesModel)) {
          var responses = {}

          if (responsesModel.length === 0) {
            responses.default = new OasResponse('')
          }

          for (var i = 0; i < responsesModel.length; i++) {
            var value = responsesModel[i]

            if (value.httpStatusCode != null) {
              if (value.reference != null) {
                var response = new Reference(value.reference)
                responses[value.httpStatusCode] = response
              } else {
                var _response = new OasResponse(value.description || '')

                if (value.headers != null) {
                  var headers = value.headers
                  if (Array.isArray(headers) && headers.length > 0) {
                    var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '')
                    var result = parameterConverter.export(headers, false)

                    for (var j = 0; j < headers.length; j++) {
                      var modelHeader = headers[j]
                      var header = result[modelHeader.name]
                      header.schema = header.schema || {}
                      if (header.type != null && typeof header.type === 'string') {
                        // $ExpectError sorry, but I don't really know how to fix it and it works as intended
                        header.schema.type = header.type
                        // $ExpectError sorry, but I don't really know how to fix it and it works as intended
                        delete header.type
                      }
                      if (header.schema != null && header.schema.type != null) {
                        var definition = modelHeader.definition
                        if (definition != null && header.schema != null) {
                          Oas30DefinitionConverter._convertFromInternalType(definitionConverter._export(definition))
                          // $ExpectError sorry, but I don't really know how to fix it and it works as intended
                          if (definition.type != null) header.schema.type = definition.type
                          // $ExpectError sorry, but I don't really know how to fix it and it works as intended
                          if (definition.format != null) header.schema.format = definition.format
                        }
                        // $ExpectError sorry, but I don't really know how to fix it and it works as intended
                        if (header.schema.type === 'array' && header.schema.items == null) header.schema.items = { type: 'string' }
                      }
                      if (header.example != null) delete header.example
                      if (header.schema.required != null) delete header.required
                      if (header.repeat != null) delete header.repeat
                    }
                    if (!_.isEmpty(result)) _response.headers = result
                  }
                }

                if (value.bodies != null) {
                  var bodies = value.bodies
                  if (Array.isArray(bodies) && bodies.length > 0) {
                    for (var _j = 0; _j < bodies.length; _j++) {
                      var val = bodies[_j]
                      var media = new OasMediaType()

                      _response.description = val.description != null && _.isEmpty(_response.description) ? val.description : _response.description

                      var _definition = val.definition
                      var schema = {}
                      if (_definition != null) {
                        schema = definitionConverter._export(_definition)
                        if (_definition.internalType != null && _definition.internalType === 'file') schema.type = 'file'
                        if (_definition.internalType == null && _definition.type == null && schema.type != null) delete schema.type
                        if (schema.required != null && schema.required === true) delete schema.required
                        if (schema.$ref != null) {
                          media.example = schema.example
                          delete schema.example
                          schema = { $ref: schema.$ref }
                        }
                      }

                      Oas30RootConverter.exportAnnotations(val, schema)

                      media.schema = schema

                      if (!_.isEmpty(schema)) {
                        _response.content = {}
                        _response.content[val.mimeType || '*/*'] = media
                      }

                      // if (!_.isEmpty(schema) && !response.schema) {
                      // 	response.schema = schema;
                      // } else if (response.schema && response.schema.$ref != null) response.schema = { type: 'object' };
                    }
                  }
                }

                Oas30RootConverter.exportAnnotations(value, _response)
                if (value.hasParams != null) _response.hasParams = value.hasParams
                responses[value.httpStatusCode || 'default'] = _response
              }
            }
          }

          operation.responses = responses
        }
      } else {
        operation.responses = {
          default: new OasResponse('')
        }
      }

      var parameters = Oas30MethodConverter.exportHeaders(model, definitionConverter)

      if (model.bodies != null) {
        var _bodies = model.bodies
        if (Array.isArray(_bodies)) {
          var content = {}
          var required = false

          for (var _i = 0; _i < _bodies.length; _i++) {
            var body = _bodies[_i]
            var _media = new OasMediaType()

            var _schema = definitionConverter._export(body.definition)

            if (_schema.example != null) {
              _media.example = _schema.example
              delete _schema.example
            }

            _media.schema = _schema
            content[body.mimeType || '*/*'] = _media

            if (body.required) required = true
          }

          var requestBody = new RequestBody(content)

          requestBody.required = required
          // requestBody.description = body.description;

          operation.requestBody = requestBody
        }
      }

      if (model.formBodies != null) {
        var formBodies = model.formBodies
        if (Array.isArray(formBodies) && formBodies.length > 0) {
          var _content = {}
          var _required = false

          for (var _i2 = 0; _i2 < formBodies.length; _i2++) {
            var _body = formBodies[_i2]
            var _media2 = new OasMediaType()

            var _schema2 = definitionConverter._export(_body.definition)

            if (_schema2.example != null) {
              _media2.example = _schema2.example
              delete _schema2.example
            }

            _media2.schema = _schema2
            _content[_body.mimeType || '*/*'] = _media2

            if (_body.required) _required = true
          }

          operation.requestBody = operation.requestBody != null
          // $ExpectError sorry, but I don't really know how to fix it and it works as intended
            ? Object.assign(operation.requestBody, _content) : new RequestBody(_content)

          // $ExpectError sorry, but I don't really know how to fix it and it works as intended
          operation.requestBody.required = operation.requestBody.required || _required
        }
      }

      var queryParameters = Oas30MethodConverter.exportParameters(model, 'parameters', definitionConverter)
      if (!_.isEmpty(queryParameters)) parameters = parameters.concat(queryParameters)

      var queryStrings = Oas30MethodConverter.exportParameters(model, 'queryStrings', definitionConverter)
      if (!_.isEmpty(queryStrings)) parameters = parameters.concat(queryStrings)

      if (!_.isEmpty(parameters)) operation.parameters = parameters

      if (model.securedBy != null && this.def && this.def.components.securitySchemes) {
        var securedByModel = model.securedBy
        var security = []
        for (var _i3 = 0; _i3 < securedByModel.length; _i3++) {
          var securityReq = securedByModel[_i3]
          if (securityReq.name !== null && Object.keys(this.def.components.securitySchemes).includes(securityReq.name)) {
            security.push(_defineProperty({}, securityReq.name, securityReq.scopes))
          }
        }
        if (!_.isEmpty(security)) {
          operation.security = security
        }
      }

      Oas30RootConverter.exportAnnotations(model, operation)
      return operation
    }
  }], [{
    key: 'exportExamples',
    value: function exportExamples (source, target, mimeType, exampleKey) {
      switch (exampleKey) {
        case 'example':
          if (source.example != null) {
            if (!target.examples) target.examples = {}
            target.examples[mimeType] = source.example
            delete source.example
          }
          break
        case 'examples':
          if (source.examples != null) {
            if (!target.examples) target.examples = {}
            target.examples[mimeType] = source.examples
            delete source.examples
          }
          break
      }
    }
  }, {
    key: 'exportRequired',
    value: function exportRequired (source, target) {
      target.required = source.required
      if (target.required != null && !target.required) {
        delete target.required
      }
    }
  }, {
    key: 'exportHeaders',
    value: function exportHeaders (object, converter) {
      var headers = []

      if (object.headers != null) {
        var headersModel = object.headers
        if (_.isArray(headersModel) && !_.isEmpty(headersModel)) {
          for (var i = 0; i < headersModel.length; i++) {
            var value = headersModel[i]
            var definition = value.definition

            var header = void 0
            if (value.reference != null) {
              header = new Reference(value.reference)
            } else {
              if (value.reference != null) {
                headers.push(new Reference(value.reference))
                continue
              }

              // $ExpectError _in is not precise enough
              header = new OasParameter(definition.name, value._in || 'header')
              if (definition != null) {
                header.description = definition.description
                delete definition.description
              }

              var schema = converter._export(definition)
              if (schema.type == null) schema.type = 'string'
              if (schema.$ref != null) delete schema.$ref
              if (schema.type === 'array' && schema.items == null) schema.items = { type: 'string' }
              delete schema.required
              header.schema = schema

              helper.removePropertiesFromObject(header, ['example'])
              Oas30MethodConverter.exportRequired(value, header)
              Oas30RootConverter.exportAnnotations(value, header)
            }
            headers.push(header)
          }
        }
      }

      return headers
    }
  }, {
    key: 'exportParameters',
    value: function exportParameters (object, paramsType, converter) {
      var parameters = []
      if (object.hasOwnProperty(paramsType)) {
        var parametersModel = paramsType === 'parameters' ? object.parameters : object.queryStrings
        if (_.isArray(parametersModel) && !_.isEmpty(parametersModel) && parametersModel != null) {
          for (var i = 0; i < parametersModel.length; i++) {
            var value = parametersModel[i]

            if (value.reference != null) {
              parameters.push(new Reference(value.reference))
              continue
            }

            var definition = value.definition
            var parameter = void 0
            if (paramsType === 'queryStrings' && definition != null && definition.properties != null) {
              var queryStrings = Oas30MethodConverter.exportMultipleQueryStrings(value, converter)
              if (!_.isEmpty(queryStrings)) parameters = parameters.concat(queryStrings)
            } else if (definition != null) {
              // $ExpectError _in is not precise enough
              parameter = new OasParameter(definition.name, value._in || 'query')

              var schema = converter._export(definition)
              if (schema.type == null && schema.$ref == null) schema.type = 'string'
              if (schema.type === 'array' && schema.items == null) schema.items = { type: 'string' }
              if (schema.repeat != null) delete schema.repeat

              if (schema.required != null) {
                parameter.required = schema.required
                delete schema.required
              }
              // path vars are always required
              if (value._in === 'path') {
                parameter.required = true
              }

              if (schema.description != null) {
                parameter.description = schema.description
                delete schema.description
              }

              parameter.schema = schema
              Oas30MethodConverter.exportRequired(value, parameter)
              helper.removePropertiesFromObject(parameter, ['example'])
              Oas30RootConverter.exportAnnotations(value, parameter)
              // if (value.hasParams != null) parameter.hasParams = value.hasParams;
            }
            if (parameter) parameters.push(parameter)
          }
        }
      }

      return parameters
    }
  }, {
    key: 'exportMultipleQueryStrings',
    value: function exportMultipleQueryStrings (object, converter) {
      var definition = object.definition
      var queryStrings = []
      if (definition != null && definition.properties != null) {
        var properties = definition.properties
        for (var i = 0; i < properties.length; i++) {
          var value = properties[i]
          var name = value.name
          // $ExpectError _in is not precise enough
          var parameter = new OasParameter(name, object._in || 'query')
          var schema = converter._export(value)
          if (definition.hasOwnProperty('propsRequired') && definition.propsRequired != null) {
            value.required = definition.propsRequired.indexOf(name) > -1
          }
          parameter.schema = schema
          Oas30MethodConverter.exportRequired(value, parameter)
          queryStrings.push(parameter)
        }
      }

      return queryStrings
    }
  }])

  return Oas30MethodConverter
}(Converter))

module.exports = Oas30MethodConverter
