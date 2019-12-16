'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;
var Resource = ConverterModel.Resource;
var Method = ConverterModel.Method;
var Response = ConverterModel.Response;
var Body = ConverterModel.Body;
var Parameter = ConverterModel.Parameter;
var Item = ConverterModel.Item;
var Header = ConverterModel.Header;
var Definition = ConverterModel.Definition;
var Annotation = ConverterModel.Annotation;
var SecurityRequirement = ConverterModel.SecurityRequirement;
var Converter = require('../converters/converter');
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var ParameterConverter = require('../common/parameterConverter');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var RamlCustomAnnotationConverter = require('../raml/ramlCustomAnnotationConverter');
var helper = require('../helpers/converter');
var ramlHelper = require('../helpers/raml');
var jsonHelper = require('../utils/json');

var RamlMethodConverter = function (_Converter) {
	_inherits(RamlMethodConverter, _Converter);

	function RamlMethodConverter() {
		_classCallCheck(this, RamlMethodConverter);

		return _possibleConstructorReturn(this, (RamlMethodConverter.__proto__ || Object.getPrototypeOf(RamlMethodConverter)).apply(this, arguments));
	}

	_createClass(RamlMethodConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var method = this._export(model);
				result[model.method] = !_.isEmpty(method) ? method : {};
			}

			return result;
		}

		// exports 1 method definition

	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {
				'name': 'displayName'
			};

			var attrIdSkip = ['responses', 'headers', 'bodies', 'formBodies', 'method', 'parameters', 'queryStrings', 'consumes', 'usage', 'path', 'produces', 'securedBy', 'annotations', 'tags', 'summary', 'externalDocs', 'deprecated', 'protocols', 'includePath'];
			var ramlDef = RamlMethodConverter.createRamlDef(model, attrIdMap, attrIdSkip);
			var definitionConverter = new RamlDefinitionConverter(this.model, this.annotationPrefix, this.def);

			if (model.hasOwnProperty('is')) {
				if (_.isArray(model.is) && !_.isEmpty(model.is) && model.is != null) {
					var is = [];
					var isList = model.is;
					for (var i = 0; i < isList.length; i++) {
						var value = isList[i];
						var trait = void 0;
						if (value.value) {
							trait = {};
							trait[value.name] = value.value;
						} else trait = value.name;
						is.push(trait);
					}
					ramlDef.is = is;
				}
			}

			if (model.hasOwnProperty('responses')) {
				if (_.isArray(model.responses) && !_.isEmpty(model.responses) && model.responses != null) {
					var responses = {};
					var responsesModel = model.responses;
					for (var _i = 0; _i < responsesModel.length; _i++) {
						var val = responsesModel[_i];
						if (val.hasOwnProperty('httpStatusCode') && !val.hasOwnProperty('reference')) {
							var response = {};
							if (val.hasOwnProperty('description') && !_.isEmpty(val.description)) response.description = val.description;
							if (val.hasOwnProperty('headers') && val.headers) {
								var headersModel = val.headers;
								if (_.isArray(headersModel) && !_.isEmpty(headersModel)) {
									var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
									var headers = parameterConverter.export(headersModel, true);
									if (!_.isEmpty(headers)) response.headers = headers;
								}
							}
							var _internalMimeTypes = model.hasOwnProperty('produces') ? model.produces : [];
							var _globalMimeTypes = this.model.hasOwnProperty('mediaType') && this.model.mediaType.hasOwnProperty('produces') ? this.model.mediaType.produces : [];
							var _mimeTypes = !_.isEmpty(_internalMimeTypes) ? _internalMimeTypes : _globalMimeTypes;
							var _body = RamlMethodConverter.exportBodies(val, definitionConverter, _mimeTypes, this.model, this.annotationPrefix, this.def);
							var bodyDef = _body[Object.keys(_body)[0]];
							if (bodyDef && bodyDef.hasOwnProperty('examples')) {
								var examples = bodyDef.examples;
								if (bodyDef.invalidJsonExample || bodyDef.type && bodyDef.type !== 'string' && typeof examples === 'string') {
									var id = this.annotationPrefix + '-responses-example';
									RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, id);
									bodyDef['(' + id + ')'] = bodyDef.hasOwnProperty('example') ? _.concat(examples, bodyDef.example) : examples;
									delete bodyDef.invalidJsonExample;
								} else {
									bodyDef.example = bodyDef.hasOwnProperty('example') ? _.concat(examples, bodyDef.example) : examples;
								}
								delete bodyDef.examples;
							}
							if (!_.isEmpty(_body)) response.body = _body;

							if (val.hasOwnProperty('globalResponseDefinition')) {
								var responseDef = val.globalResponseDefinition;
								var _id = this.annotationPrefix + '-global-response-definition';
								RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id);
								response['(' + _id + ')'] = responseDef;
							}
							RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, this.def, val, response);
							var httpStatusCode = val.httpStatusCode;
							if (httpStatusCode === 'default') {
								var _id2 = this.annotationPrefix + '-responses-default';
								RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id2);
								ramlDef['(' + _id2 + ')'] = response;
							} else if (httpStatusCode) responses[httpStatusCode] = _.isEmpty(response) ? {} : response;
						}
					}
					if (!_.isEmpty(responses)) ramlDef.responses = responses;
				}
			}

			if (model.hasOwnProperty('headers') && model.headers != null) {
				var _headersModel = model.headers;
				if (_.isArray(_headersModel) && !_.isEmpty(_headersModel)) {
					var _parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
					var _headers = _parameterConverter.export(_headersModel, true);
					if (!_.isEmpty(_headers)) ramlDef.headers = _headers;
				}
			}

			if (model.hasOwnProperty('parameters') && model.parameters != null) {
				var parametersModel = model.parameters;
				if (_.isArray(parametersModel) && !_.isEmpty(parametersModel)) {
					var _parameterConverter2 = new ParameterConverter(this.model, this.annotationPrefix, this.def, 'query');
					var queryParameters = _parameterConverter2.export(parametersModel);
					if (!_.isEmpty(queryParameters)) ramlDef.queryParameters = queryParameters;
				}
			}

			if (model.hasOwnProperty('queryStrings') && model.queryStrings != null) {
				var queryStringsModel = model.queryStrings;
				if (_.isArray(queryStringsModel) && !_.isEmpty(queryStringsModel)) {
					var _parameterConverter3 = new ParameterConverter(this.model, this.annotationPrefix, this.def, 'query');
					var queryString = _parameterConverter3.export(queryStringsModel);
					if (!_.isEmpty(queryString)) ramlDef.queryString = queryString.queryString;
				}
			}

			var internalMimeTypes = model.hasOwnProperty('consumes') ? model.consumes : [];
			var globalMimeTypes = this.model.hasOwnProperty('mediaType') && this.model.mediaType.hasOwnProperty('consumes') ? this.model.mediaType.consumes : [];
			var mimeTypes = !_.isEmpty(internalMimeTypes) ? internalMimeTypes : globalMimeTypes;
			var body = RamlMethodConverter.exportBodies(model, definitionConverter, mimeTypes, this.model, this.annotationPrefix, this.def);
			if (!_.isEmpty(body)) ramlDef.body = body;

			if (model.hasOwnProperty('securedBy')) {
				ramlDef.securedBy = RamlMethodConverter.exportSecurityRequirements(model);
			}

			if (model.hasOwnProperty('protocols') && model.protocols != null) {
				var protocols = model.protocols;
				ramlDef.protocols = protocols.map(function (protocol) {
					return protocol.toUpperCase();
				});
			}

			if (model.hasOwnProperty('summary')) {
				var _id3 = this.annotationPrefix + '-summary';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id3);
				ramlDef['(' + _id3 + ')'] = model.summary;
			}
			if (model.hasOwnProperty('tags')) {
				var _id4 = this.annotationPrefix + '-tags';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id4);
				ramlDef['(' + _id4 + ')'] = model.tags;
			}
			if (model.hasOwnProperty('deprecated') && model.deprecated) {
				var _id5 = this.annotationPrefix + '-deprecated';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id5);
				ramlDef['(' + _id5 + ')'] = model.deprecated;
			}
			if (model.hasOwnProperty('externalDocs')) {
				var _id6 = this.annotationPrefix + '-externalDocs';
				RamlCustomAnnotationConverter._createAnnotationType(this.def, this.annotationPrefix, _id6);
				ramlDef['(' + _id6 + ')'] = model.externalDocs;
			}
			RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, this.def, model, ramlDef);

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;

				var ramlDef = ramlDefs[id];
				var method = this._import(ramlDef);
				result.push(method);
			}
			return result;
		}

		// imports 1 method definition

	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var attrIdMap = {
				'displayName': 'name'
			};

			var attrIdSkip = ['responses', 'description', 'headers', 'body', 'queryParameters', 'queryString', 'name', 'usage', 'is', 'securedBy', 'baseUriParameters', 'annotations', 'protocols', 'sourceMap'];
			var model = RamlMethodConverter.createMethod(ramlDef, attrIdMap, attrIdSkip);
			var definitionConverter = new RamlDefinitionConverter(null, null, this.def);
			definitionConverter.version = this.version;
			var isRaml08Version = ramlHelper.isRaml08Version(this.version);

			if (ramlDef.hasOwnProperty('is') && _.isArray(ramlDef.is)) {
				var is = [];
				for (var id in ramlDef.is) {
					if (!ramlDef.is.hasOwnProperty(id)) continue;

					var value = ramlDef.is[id];
					if (typeof value === 'string') {
						var item = new Item();
						item.name = value;
						is.push(item);
					} else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value != null) {
						var name = Object.keys(value)[0];
						var _item = new Item();
						_item.name = name;
						_item.value = value[name];
						is.push(_item);
					}
				}
				model.is = is;
			}

			if (ramlDef.hasOwnProperty('description') && !_.isEmpty(ramlDef.description)) {
				model.description = ramlDef.description;
			}

			if (ramlDef.hasOwnProperty('responses')) {
				var responses = [];
				if (_.isArray(ramlDef.responses)) {
					var attrSecurityIdMap = {
						'code': 'httpStatusCode'
					};
					for (var _id7 in ramlDef.responses) {
						if (!ramlDef.responses.hasOwnProperty(_id7)) continue;

						var _value = ramlDef.responses[_id7];
						var hasParams = RamlMethodConverter.hasParams(_value);
						var response = RamlMethodConverter.createResponse(ramlDef.responses[_id7], attrSecurityIdMap, []);
						if (hasParams) response.hasParams = true;
						responses.push(response);
					}
				} else {
					for (var _id8 in ramlDef.responses) {
						if (!ramlDef.responses.hasOwnProperty(_id8)) continue;

						var _value2 = ramlDef.responses[_id8];
						var _hasParams = RamlMethodConverter.hasParams(_value2);
						var _response = new Response();
						_response.httpStatusCode = _id8;
						if (_value2.hasOwnProperty('description')) _response.description = _value2.description;
						var _headers2 = RamlMethodConverter.importHeaders(_value2);
						if (!_.isEmpty(_headers2)) _response.headers = _headers2;
						var _bodies = RamlMethodConverter.importBodies(_value2, definitionConverter, this.model, isRaml08Version);
						if (!_.isEmpty(_bodies)) _response.bodies = _bodies;
						RamlAnnotationConverter.importAnnotations(_value2, _response, this.model);
						if (_hasParams) _response.hasParams = true;
						responses.push(_response);
					}
				}
				model.responses = responses;
			}

			var headers = RamlMethodConverter.importHeaders(ramlDef);
			if (!_.isEmpty(headers)) model.headers = headers;

			if (ramlDef.hasOwnProperty('queryParameters')) {
				var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
				var parameters = [];
				for (var _id9 in ramlDef.queryParameters) {
					if (!ramlDef.queryParameters.hasOwnProperty(_id9)) continue;

					var _value3 = ramlDef.queryParameters[_id9];
					if (_.isArray(_value3)) continue;
					var _hasParams2 = RamlMethodConverter.hasParams(_value3);
					var parameter = parameterConverter._import(_value3);
					parameter._in = 'query';
					if (_hasParams2) parameter.hasParams = true;
					parameters.push(parameter);
				}
				model.parameters = parameters;
			}

			if (ramlDef.hasOwnProperty('queryString')) {
				var queryStrings = [];
				var queryString = new Parameter();
				var definition = definitionConverter._import(ramlDef.queryString);
				queryString.definition = definition;
				RamlMethodConverter.importRequired(ramlDef.queryString, queryString, isRaml08Version);
				queryString._in = 'query';
				queryString.name = 'queryString';
				queryStrings.push(queryString);
				model.queryStrings = queryStrings;
			}

			var bodies = RamlMethodConverter.importBodies(ramlDef, definitionConverter, this.model, isRaml08Version);
			if (!_.isEmpty(bodies)) model.bodies = bodies;

			if (ramlDef.hasOwnProperty('body') && _.isEmpty(model.bodies)) {
				var formBodies = [];
				for (var _id10 in ramlDef.body) {
					if (!ramlDef.body.hasOwnProperty(_id10) || !helper.getValidFormDataMimeTypes.includes(_id10)) continue;

					var _value4 = ramlDef.body[_id10];
					if (isRaml08Version && _value4.hasOwnProperty('formParameters')) {
						for (var index in _value4.formParameters) {
							if (!_value4.hasOwnProperty('formParameters')) continue;

							var val = _value4.formParameters[index];
							var formBody = RamlMethodConverter.importFormBodies(val, _id10, index, definitionConverter, isRaml08Version);
							formBodies.push(formBody);
						}
					} else {
						var _formBody = RamlMethodConverter.importFormBodies(_value4, _id10, 'formData', definitionConverter, isRaml08Version);
						formBodies.push(_formBody);
					}
				}
				if (!_.isEmpty(formBodies)) model.formBodies = formBodies;
			}

			if (isRaml08Version && ramlDef.hasOwnProperty('baseUriParameters')) {
				var _parameterConverter4 = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
				for (var _id11 in ramlDef.baseUriParameters) {
					if (!ramlDef.baseUriParameters.hasOwnProperty(_id11)) continue;

					var baseUriParameter = _parameterConverter4._import(ramlDef.baseUriParameters[_id11]);
					if (this.model.baseUriParameters) this.model.baseUriParameters.push(baseUriParameter);
				}
			}

			if (ramlDef.hasOwnProperty('annotations')) {
				if (!_.isEmpty(ramlDef.annotations)) {
					if (ramlDef.annotations.hasOwnProperty('oas-tags')) {
						var tags = ramlDef.annotations['oas-tags'].structuredValue;
						model.tags = tags;
						delete ramlDef.annotations['oas-tags'];
					}
					var annotationConverter = new RamlAnnotationConverter();
					var annotations = annotationConverter._import(ramlDef);
					if (!_.isEmpty(annotations)) model.annotations = annotations;
				}
			}

			if (ramlDef.hasOwnProperty('securedBy')) {
				var securedBy = RamlMethodConverter.importSecurityRequirements(ramlDef);
				model.securedBy = securedBy;
			}

			if (ramlDef.hasOwnProperty('protocols')) {
				if (_.isArray(ramlDef.protocols)) {
					var protocols = ramlDef.protocols.map(function (protocol) {
						return protocol.toLowerCase();
					});
					model.protocols = protocols;
				} else {
					var _protocols = [ramlDef.protocols.toLowerCase()];
					model.protocols = _protocols;
				}
			}

			if (ramlDef.hasOwnProperty('sourceMap') && ramlDef['sourceMap'].hasOwnProperty('path')) {
				model['includePath'] = ramlDef['sourceMap']['path'];
			}

			return model;
		}
	}], [{
		key: 'exportSecurityRequirements',
		value: function exportSecurityRequirements(object) {
			var security = [];

			var securedBy = object.securedBy;
			if (securedBy != null) {
				for (var i = 0; i < securedBy.length; i++) {
					var securityReq = securedBy[i];
					if (securityReq.hasOwnProperty('scopes') && !_.isEmpty(securityReq.scopes)) {
						var scopes = securityReq.scopes;
						var result = {};
						result[securityReq.name] = { scopes: scopes };
						security.push(result);
					} else {
						security.push(securityReq.name);
					}
				}
			}

			return security;
		}
	}, {
		key: 'exportBodies',
		value: function exportBodies(object, converter, mimeTypes, model, annotationPrefix, ramlDef) {
			var body = {};
			if (object.hasOwnProperty('bodies')) {
				var bodies = object.bodies;
				if (_.isArray(bodies) && !_.isEmpty(bodies)) {
					for (var i = 0; i < bodies.length; i++) {
						var val = bodies[i];
						var definition = val.definition;
						var bodyDef = {};
						var schema = converter._export(definition);
						if (val.hasOwnProperty('description')) {
							bodyDef.description = val.description;
							if (definition != null && definition.hasOwnProperty('description')) bodyDef.schema = schema;else _.assign(bodyDef, schema);
						} else _.assign(bodyDef, schema);
						if (bodyDef.hasOwnProperty('schema')) {
							_.assign(bodyDef, bodyDef.schema);
							delete bodyDef.schema;
						}
						RamlMethodConverter.exportRequired(val, bodyDef);
						if (val.hasOwnProperty('name')) {
							var id = annotationPrefix + '-body-name';
							RamlCustomAnnotationConverter._createAnnotationType(ramlDef, annotationPrefix, id);
							bodyDef['(' + id + ')'] = val.name;
						}
						RamlAnnotationConverter.exportAnnotations(model, annotationPrefix, ramlDef, val, bodyDef);
						if (val.mimeType) {
							var mimeType = val.mimeType;
							body[mimeType] = bodyDef;
						} else if (mimeTypes != null) {
							if (_.isEmpty(mimeTypes)) mimeTypes.push('application/json');
							for (var j = 0; j < mimeTypes.length; j++) {
								body[mimeTypes[j]] = bodyDef;
							}
						}
					}
				}
			}

			if (object.hasOwnProperty('formBodies')) {
				var formBodies = object.formBodies;
				if (_.isArray(formBodies) && !_.isEmpty(formBodies) && mimeTypes != null) {
					for (var _i2 = 0; _i2 < formBodies.length; _i2++) {
						var _val = formBodies[_i2];
						var _definition = _val.definition;
						var _mimeType = _val.mimeType ? _val.mimeType : !_.isEmpty(mimeTypes) && helper.getValidFormDataMimeTypes.includes(mimeTypes[0]) ? mimeTypes[0] : 'multipart/form-data';
						var _bodyDef = converter._export(_definition);
						if (_val.hasOwnProperty('description')) _bodyDef.description = _val.description;
						RamlMethodConverter.exportRequired(_val, _bodyDef);
						RamlAnnotationConverter.exportAnnotations(model, annotationPrefix, ramlDef, _val, _bodyDef);
						if (!body[_mimeType]) {
							body[_mimeType] = {};
							body[_mimeType].properties = {};
						}
						if (_definition != null) body[_mimeType].properties[_definition.name] = _bodyDef;
					}
				}
			}
			return body;
		}
	}, {
		key: 'exportRequired',
		value: function exportRequired(source, target) {
			if (source.hasOwnProperty('required')) target.required = source.required;
			if (target.hasOwnProperty('required') && target.required) delete target.required;
		}
	}, {
		key: 'createRamlDef',
		value: function createRamlDef(method, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, method);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				var value = result[id];
				if (value != null) {
					result[attrIdMap[id]] = value;
					delete result[id];
				}
			});

			return result;
		}
	}, {
		key: 'createMethod',
		value: function createMethod(ramlDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(ramlDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Method();
			_.assign(result, object);

			return result;
		}
	}, {
		key: 'createResponse',
		value: function createResponse(ramlDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(ramlDef).map(function (_ref3) {
				var _ref4 = _slicedToArray(_ref3, 2),
				    key = _ref4[0],
				    value = _ref4[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Response();
			_.assign(result, object);

			return result;
		}
	}, {
		key: 'importSecurityRequirements',
		value: function importSecurityRequirements(object) {
			var securedBy = [];
			object.securedBy.map(function (security) {
				var securityReq = new SecurityRequirement();
				if ((typeof security === 'undefined' ? 'undefined' : _typeof(security)) === 'object' && security !== null) {
					securityReq.name = Object.keys(security)[0];
					if (security[securityReq.name].hasOwnProperty('scopes')) {
						var scopes = security[securityReq.name].scopes;
						securityReq.scopes = scopes;
					}
				} else {
					securityReq.name = security;
					securityReq.scopes = [];
				}

				securedBy.push(securityReq);
			});

			return securedBy;
		}
	}, {
		key: 'importFormBodies',
		value: function importFormBodies(object, mimeType, name, converter, isRaml08Version) {
			var body = new Body();
			body.mimeType = mimeType;
			var definition = converter._import(object);
			definition.name = name;
			if (object.hasOwnProperty('description')) body.description = object.description;
			RamlMethodConverter.importRequired(object, body, isRaml08Version);
			if (object.hasOwnProperty('examples')) RamlMethodConverter.importExamples(object, definition);
			body.definition = definition;
			RamlAnnotationConverter.importAnnotations(object, body, this.model);

			return body;
		}
	}, {
		key: 'importBodies',
		value: function importBodies(object, converter, model, isRaml08Version) {
			var bodies = [];

			if (object.hasOwnProperty('body')) {
				for (var id in object.body) {
					if (!object.body.hasOwnProperty(id) || helper.getValidFormDataMimeTypes.includes(id)) continue;

					var value = object.body[id];
					var hasParams = RamlMethodConverter.hasParams(value);
					var body = new Body();
					body.mimeType = id;
					if (value.hasOwnProperty('description')) {
						body.description = value.description;
						delete value.description;
					}
					if (value.hasOwnProperty('type') && _typeof(value.type) === 'object' && !_.isArray(value.type)) {
						value.schema = value.type;
						delete value.type;
					}
					if (value.schema == null) delete value.schema;
					var schema = value.hasOwnProperty('schema') ? value.schema : value;
					if (isRaml08Version) RamlMethodConverter.importRaml08Schema(value, body, converter, model);else {
						if (_.isArray(schema)) {
							if (helper.isJson(schema[0])) {
								schema = { type: schema, typePropertyKind: 'INPLACE' };
							} else schema = { type: schema };
						}
						if (schema.hasOwnProperty('example') && !schema.example && schema.hasOwnProperty('structuredExample')) {
							schema.example = typeof schema.structuredExample.value === 'string' ? jsonHelper.parse(schema.structuredExample.value) : schema.structuredExample.value;
							delete schema.structuredExample;
						}
						var definition = converter._import(schema);
						body.definition = definition;
					}
					var def = body.definition;
					if (model && def != null && def.hasOwnProperty('definitions')) {
						var types = model.types ? model.types : [];
						var typeNames = types.map(function (type) {
							return type.name;
						});
						var defs = def.definitions;
						for (var typeName in defs) {
							if (!defs.hasOwnProperty(typeName)) continue;

							if (typeNames.indexOf(typeName) < 0) {
								var _definition2 = converter._import(defs[typeName]);
								_definition2.name = typeName;
								types.push(_definition2);
							}
						}
						if (!_.isEmpty(types)) model.types = types;
						delete def.definitions;
					}
					if (def != null) {
						if (!schema.hasOwnProperty('type') && !jsonHelper.parse(schema).hasOwnProperty('type')) delete def.internalType;
						RamlMethodConverter.importRequired(value, body, isRaml08Version);
						RamlMethodConverter.importExamples(value, def);
					}
					RamlAnnotationConverter.importAnnotations(value, body, this.model);
					if (hasParams) body.hasParams = true;
					bodies.push(body);
				}
			}

			return bodies;
		}
	}, {
		key: 'importRaml08Schema',
		value: function importRaml08Schema(source, target, converter, model) {
			var definition = new Definition();
			if (source.hasOwnProperty('example')) {
				definition.example = source.example;
				delete definition.examples;
			}
			if (source.hasOwnProperty('schema')) {
				var schema = jsonHelper.parse(source.schema);
				var isReference = typeof schema === 'string';
				if (isReference) schema = { type: schema };
				if (helper.isJson(schema.type)) schema.typePropertyKind = 'INPLACE';
				definition = converter._import(schema);
				if (isReference) {
					var type = definition.type;
					var internalType = definition.internalType;
					var typeNames = model && model.types ? model.types.map(function (type) {
						return type.name;
					}) : [];
					if (type) {
						definition = new Definition();
						definition.reference = type;
					} else if (internalType && typeNames.includes(internalType)) {
						definition = new Definition();
						definition.reference = internalType;
					}
				}
				if (source.hasOwnProperty('example')) {
					definition.example = jsonHelper.isJson(source.example) ? JSON.parse(source.example) : source.example;
				}
			}
			target.definition = definition;
		}
	}, {
		key: 'importHeaders',
		value: function importHeaders(object) {
			var headers = [];

			if (object.hasOwnProperty('headers')) {
				var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
				for (var id in object.headers) {
					if (!object.headers.hasOwnProperty(id)) continue;

					var headerDef = object.headers[id];
					var hasParams = RamlMethodConverter.hasParams(headerDef);
					var parameter = parameterConverter._import(headerDef);
					var header = new Header();
					_.assign(header, parameter);
					header._in = 'header';
					if (hasParams) header.hasParams = true;
					headers.push(header);
				}
			}

			return headers;
		}
	}, {
		key: 'importRequired',
		value: function importRequired(source, target, isRaml08Version) {
			target.required = source.hasOwnProperty('required') ? source.required : !isRaml08Version;
		}
	}, {
		key: 'importExamples',
		value: function importExamples(source, target) {
			var example = {};
			if (source.hasOwnProperty('examples')) {
				for (var id in source.examples) {
					if (!source.examples.hasOwnProperty(id)) continue;

					var value = source.examples[id];
					example[value.name] = value.structuredValue;
				}
				delete target.examples;
			} else if (source.hasOwnProperty('example')) {
				example = jsonHelper.parse(source.example);
			}

			if (!_.isEmpty(example)) target.example = example;
		}
	}, {
		key: 'hasParams',
		value: function hasParams(object) {
			var hasParams = false;
			var regex = /\<<([^)]+)\>>/;
			for (var id in object) {
				var value = object[id];
				if (typeof value === 'string' && value.match(regex) || typeof value === 'number' && isNaN(value)) {
					return true;
				} else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
					hasParams = RamlMethodConverter.hasParams(value);
				}
			}

			return hasParams;
		}
	}]);

	return RamlMethodConverter;
}(Converter);

module.exports = RamlMethodConverter;