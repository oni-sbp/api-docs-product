'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;
var Method = ConverterModel.Method;
var Response = ConverterModel.Response;
var Parameter = ConverterModel.Parameter;
var Definition = ConverterModel.Definition;
var Body = ConverterModel.Body;
var Header = ConverterModel.Header;
var Item = ConverterModel.Item;
var MediaType = ConverterModel.MediaType;
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var Oas20RootConverter = require('../oas20/oas20RootConverter');
var Oas20DefinitionConverter = require('../oas20/oas20DefinitionConverter');
var Oas20AnnotationConverter = require('../oas20/oas20AnnotationConverter');
var ParameterConverter = require('../common/parameterConverter');
var SecurityRequirement = ConverterModel.SecurityRequirement;
var ExternalDocumentation = ConverterModel.ExternalDocumentation;
var helper = require('../helpers/converter');
var stringsHelper = require('../utils/strings');
var oasHelper = require('../helpers/oas20');

var Oas20MethodConverter = function (_Converter) {
	_inherits(Oas20MethodConverter, _Converter);

	function Oas20MethodConverter(model, dereferencedAPI, resourcePath, def) {
		_classCallCheck(this, Oas20MethodConverter);

		var _this = _possibleConstructorReturn(this, (Oas20MethodConverter.__proto__ || Object.getPrototypeOf(Oas20MethodConverter)).call(this, model, '', def));

		_this.dereferencedAPI = dereferencedAPI;
		_this.resourcePath = resourcePath;
		return _this;
	}

	_createClass(Oas20MethodConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				result[model.method] = this._export(model);
			}

			return result;
		}

		// exports 1 method definition

	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {
				'protocols': 'schemes',
				'name': 'operationId'
			};
			var attrIdSkip = ['method', 'responses', 'headers', 'bodies', 'formBodies', 'parameters', 'queryStrings', 'is', 'path', 'produces', 'consumes', 'securedBy', 'annotations', 'includePath'];
			var oasDef = Oas20MethodConverter.createOasDef(model, attrIdMap, attrIdSkip);
			var definitionConverter = new Oas20DefinitionConverter(this.model, this.annotationPrefix, this.def);

			if (!oasDef.hasOwnProperty('operationId')) oasDef.operationId = stringsHelper.computeOperationId(model.method, model.path);

			if (model.hasOwnProperty('responses') && model.responses != null) {
				var responsesModel = model.responses;
				if (_.isArray(responsesModel) && !_.isEmpty(responsesModel)) {
					var responses = {};
					var produces = [];
					if (model.hasOwnProperty('produces') && model.produces != null) produces = model.produces;
					for (var i = 0; i < responsesModel.length; i++) {
						var value = responsesModel[i];
						if (value.hasOwnProperty('httpStatusCode')) {
							var response = {};
							if (value.hasOwnProperty('reference')) {
								response['$ref'] = value.reference;
								if (value.hasOwnProperty('bodies') && value.bodies && !_.isEmpty(value.bodies)) {
									var bodies = value.bodies;
									var mimeType = bodies[0].mimeType;
									if (mimeType != null && !produces.includes(mimeType)) produces.push(mimeType);
								}
							} else {
								response.description = value.hasOwnProperty('description') && value.description != null ? value.description : '';
								if (value.hasOwnProperty('headers') && value.headers) {
									var headers = value.headers;
									if (_.isArray(headers) && !_.isEmpty(headers)) {
										var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
										var result = parameterConverter.export(headers);
										for (var j = 0; j < headers.length; j++) {
											var modelHeader = headers[j];
											var header = result[modelHeader.name];
											if (header.hasOwnProperty('type')) {
												var definition = modelHeader.definition;
												if (definition != null) {
													Oas20DefinitionConverter._convertFromInternalType(definition);
													if (definition.hasOwnProperty('type')) header.type = definition.type;
													if (definition.hasOwnProperty('format')) header.format = definition.format;
												}
												if (header.type === 'array' && !header.hasOwnProperty('items')) header.items = { type: 'string' };
											}
											if (header.hasOwnProperty('example')) delete header.example;
											if (header.hasOwnProperty('required')) delete header.required;
											if (header.hasOwnProperty('repeat')) delete header.repeat;
										}
										if (!_.isEmpty(result)) response.headers = result;
									}
								}
								if (value.hasOwnProperty('bodies') && value.bodies) {
									var _bodies = value.bodies;
									if (_.isArray(_bodies) && !_.isEmpty(_bodies)) {
										var schema = {};
										for (var _j = 0; _j < _bodies.length; _j++) {
											var val = _bodies[_j];
											if (val.mimeType && !produces.includes(val.mimeType)) produces.push(val.mimeType);
											response.description = val.hasOwnProperty('description') && _.isEmpty(response.description) ? val.description : response.description;
											var _definition = val.definition;
											if (_definition != null) {

												Oas20MethodConverter.exportExamples(_definition, response, val.mimeType, 'examples');
												schema = definitionConverter._export(_definition);
												if (_definition.hasOwnProperty('internalType') && _definition.internalType === 'file') schema.type = 'file';
												if (!_definition.hasOwnProperty('internalType') && !_definition.hasOwnProperty('type') && schema.hasOwnProperty('type')) delete schema.type;
												if (schema.hasOwnProperty('required') && schema.required === true) delete schema.required;
												if (schema.hasOwnProperty('$ref')) {
													Oas20MethodConverter.exportExamples(schema, response, val.mimeType, 'example');
													schema = { $ref: schema.$ref };
												}
												Oas20RootConverter.exportAnnotations(val, schema);
												if (!_.isEmpty(schema) && !response.schema) response.schema = schema;else if (response.schema && response.schema.hasOwnProperty('$ref')) response.schema = { type: 'object' };
											}
										}
									}
								}
							}
							Oas20RootConverter.exportAnnotations(value, response);
							if (value.hasOwnProperty('hasParams')) response.hasParams = value.hasParams;
							var httpStatusCode = value.httpStatusCode;
							if (httpStatusCode) responses[httpStatusCode] = response;
						}
					}
					if (!_.isEmpty(produces)) {
						oasDef.produces = produces;
					}
					oasDef.responses = responses;
				}
			} else {
				oasDef.responses = {
					default: {
						description: ''
					}
				};
			}

			var parameters = Oas20MethodConverter.exportHeaders(model, definitionConverter);

			var consumes = [];
			if (model.hasOwnProperty('consumes')) consumes = model.consumes;
			if (model.hasOwnProperty('bodies') && model.bodies != null) {
				var _bodies2 = model.bodies;
				if (_.isArray(_bodies2) && !_.isEmpty(_bodies2)) {
					var _value = _bodies2[0];
					var _definition2 = _value.definition;
					var parameter = {};
					parameter.schema = Object.assign({}, definitionConverter._export(_definition2));
					parameter.in = 'body';
					parameter.name = 'body';
					if (_value.hasOwnProperty('description')) parameter.description = _value.description;
					if (_bodies2.length > 1) parameter.schema = { type: 'object' };
					if (!parameter.schema.type && !parameter.schema.$ref) {
						if (parameter.schema.hasOwnProperty('properties')) parameter.schema.type = 'object';else parameter.schema.type = 'string';
					}
					Oas20MethodConverter.exportRequired(_value, parameter);
					if (_definition2 != null && _definition2.hasOwnProperty('example') && !parameter.schema.hasOwnProperty('example')) parameter.schema.example = _definition2.example;
					Oas20RootConverter.exportAnnotations(_value, parameter);
					if (_value.hasOwnProperty('hasParams')) parameter.hasParams = _value.hasParams;
					parameters.push(parameter);

					if (consumes != null) {
						for (var _i = 0; _i < _bodies2.length; _i++) {
							var body = _bodies2[_i];
							if (body.mimeType && !consumes.includes(body.mimeType)) consumes.push(body.mimeType);
						}
					}
				}
			}

			if (model.hasOwnProperty('formBodies') && model.formBodies != null) {
				var formBodies = model.formBodies;
				if (_.isArray(formBodies) && !_.isEmpty(formBodies)) {
					for (var _i2 = 0; _i2 < formBodies.length; _i2++) {
						var _body = formBodies[_i2];
						if (_body.mimeType && consumes != null && !consumes.includes(_body.mimeType)) consumes.push(_body.mimeType);
						var _definition3 = _body.definition;
						if (_definition3 != null) {

							if (_definition3.internalType === 'file' && consumes != null && !consumes.includes('multipart/form-data')) consumes.push('multipart/form-data');
							var input = [];
							var propertiesRequired = _definition3.propsRequired ? _definition3.propsRequired : [];
							var hasProperties = void 0;
							if (_definition3.hasOwnProperty('properties') && _definition3.properties != null) {
								input = _definition3.properties;
								hasProperties = true;
							} else {
								hasProperties = false;
								var bodyDef = _definition3;
								if (_body.hasOwnProperty('required')) bodyDef.required = _body.required;
								input = [bodyDef];
							}
							for (var _i3 = 0; _i3 < input.length; _i3++) {
								var param = input[_i3];
								var _parameter = {};
								_parameter.in = 'formData';
								_parameter.name = param.name;
								if (param.internalType) {
									if (param.internalType === 'file') {
										param.type = 'file';
										delete param.internalType;
									} else if (param.internalType === 'datetime') {
										param.type = 'datetime';
										delete param.internalType;
									} else Oas20DefinitionConverter._convertFromInternalType(param);
								}
								_parameter.type = param.type;
								if (!_parameter.type) _parameter.type = 'string';
								if (param.hasOwnProperty('description')) _parameter.description = param.description;
								if (hasProperties) param.required = propertiesRequired.includes(param.name);
								if (_parameter.type === 'array' && !_parameter.hasOwnProperty('items')) _parameter.items = { type: 'string' };
								Oas20MethodConverter.exportRequired(param, _parameter);
								Oas20RootConverter.exportAnnotations(param, _parameter);
								parameters.push(_parameter);
							}
						}
					}
					if (consumes != null && _.isEmpty(_.intersection(consumes, helper.getValidFormDataMimeTypes))) consumes.push('multipart/form-data');
				}
			}
			if (!_.isEmpty(consumes)) oasDef.consumes = consumes;

			var queryParameters = Oas20MethodConverter.exportParameters(model, 'parameters', definitionConverter);
			if (!_.isEmpty(queryParameters)) parameters = parameters.concat(queryParameters);

			var queryStrings = Oas20MethodConverter.exportParameters(model, 'queryStrings', definitionConverter);
			if (!_.isEmpty(queryStrings)) parameters = parameters.concat(queryStrings);

			if (!_.isEmpty(parameters)) oasDef.parameters = parameters;

			if (model.hasOwnProperty('securedBy') && model.securedBy != null && this.def && this.def.securityDefinitions) {
				var securedByModel = model.securedBy;
				var security = [];
				for (var _i4 = 0; _i4 < securedByModel.length; _i4++) {
					var securityReq = securedByModel[_i4];
					if (securityReq.name !== null && Object.keys(this.def.securityDefinitions).includes(securityReq.name)) security.push(_defineProperty({}, securityReq.name, securityReq.scopes));
				}
				if (!_.isEmpty(security)) {
					oasDef['security'] = security;
				}
			}

			Oas20RootConverter.exportAnnotations(model, oasDef);

			if (this.model && this.model.hasOwnProperty('mediaType')) {
				var mediaType = this.model.mediaType;
				if (mediaType.hasOwnProperty('consumes') && oasDef.hasOwnProperty('consumes')) {
					var _consumes = mediaType.consumes;
					if (_consumes != null && oasDef.consumes != null) {
						oasDef.consumes = oasDef.consumes.filter(function (consume) {
							return !_consumes.includes(consume);
						});
					}
					if (_.isEmpty(oasDef.consumes)) delete oasDef.consumes;
				}
				if (mediaType.hasOwnProperty('produces') && oasDef.hasOwnProperty('produces')) {
					var _produces = mediaType.produces;
					if (_produces != null) {
						oasDef.produces = oasDef.produces.filter(function (produce) {
							return !_produces.includes(produce);
						});
					}
					if (_.isEmpty(oasDef.produces)) delete oasDef.produces;
				}
			}
			return oasDef;
		}
	}, {
		key: 'import',
		value: function _import(oasDefs) {
			var validMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'];
			var result = [];
			if (_.isEmpty(oasDefs)) return result;

			var parameters = [];
			if (oasDefs.hasOwnProperty('parameters')) {
				for (var id in oasDefs.parameters) {
					if (!oasDefs.parameters.hasOwnProperty(id)) continue;

					var parameter = oasHelper.isFilePath(oasDefs.parameters[id]) && this.dereferencedAPI ? this.dereferencedAPI.parameters[id] : oasDefs.parameters[id];
					if (parameter.in === 'header') parameters.push(parameter);
				}
			}

			for (var _id in oasDefs) {
				if (!oasDefs.hasOwnProperty(_id) || !validMethods.includes(_id)) continue;

				var oasDef = oasDefs[_id].hasOwnProperty('$ref') ? this.dereferencedAPI[_id] : oasDefs[_id];
				this.currentMethod = _id;
				var parametersDef = oasDef.parameters ? oasDef.parameters.concat(parameters) : parameters;
				if (!_.isEmpty(parametersDef)) oasDef.parameters = parametersDef;
				this.method = _id;
				var method = this._import(oasDef);
				method.method = _id;
				result.push(method);
			}

			return result;
		}

		// imports 1 method definition

	}, {
		key: '_import',
		value: function _import(oasDef) {
			var _this2 = this;

			var attrIdMap = {
				'operationId': 'name',
				'schemes': 'protocols'
			};

			var attrIdSkip = ['responses', 'description', 'parameters', 'security', 'externalDocs'];
			var model = Oas20MethodConverter.createMethod(oasDef, attrIdMap, attrIdSkip, oasHelper.getAnnotationPrefix);
			var definitionConverter = new Oas20DefinitionConverter(this.model, this.annotationPrefix, this.def);

			if (oasDef.hasOwnProperty('security')) {
				var result = [];
				oasDef.security.map(function (security) {
					var securityReq = new SecurityRequirement();
					securityReq.name = Object.keys(security)[0];
					securityReq.scopes = security[securityReq.name];
					result.push(securityReq);
				});
				if (!_.isEmpty(result)) {
					model.securedBy = result;
				}
			}

			if (oasDef.hasOwnProperty('description') && !_.isEmpty(oasDef.description)) {
				model.description = oasDef.description;
			}

			if (oasDef.hasOwnProperty('responses')) {
				if (!_.isEmpty(oasDef.responses)) {
					var responses = [];
					for (var id in oasDef.responses) {
						if (!oasDef.responses.hasOwnProperty(id)) continue;

						var value = oasDef.responses[id];
						var response = new Response();
						response.httpStatusCode = id;
						if (value.hasOwnProperty('$ref') && this.model.responses) {
							(function () {
								var reference = stringsHelper.computeResourceDisplayName(value.$ref);
								var modelResponses = _this2.model.responses.filter(function (modelResponse) {
									return modelResponse.name === reference;
								});
								if (!_.isEmpty(modelResponses)) {
									var def = modelResponses[0];
									if (def.hasOwnProperty('description')) response.description = def.description;
									if (def.hasOwnProperty('headers')) response.headers = def.headers;
									if (def.hasOwnProperty('bodies')) response.bodies = def.bodies;
								}
								response.globalResponseDefinition = reference;
							})();
						} else {
							if (value.hasOwnProperty('description')) response.description = value.description;
							if (value.hasOwnProperty('headers')) {
								var headers = [];
								var _definitionConverter = new Oas20DefinitionConverter(this.model, this.annotationPrefix, this.def);
								for (var index in value.headers) {
									var header = new Header();
									header.name = index;
									var definition = _definitionConverter._import(value.headers[index]);
									header.definition = definition;
									headers.push(header);
								}
								response.headers = headers;
							}
							var body = new Body();
							if (value.hasOwnProperty('schema')) {
								var annotationConverter = new Oas20AnnotationConverter(this.model);
								var annotations = annotationConverter._import(value.schema);
								var _definition4 = definitionConverter._import(value.schema);
								if (!_.isEmpty(annotations)) _definition4.annotations = annotations;
								if (value.schema.hasOwnProperty('example')) Oas20MethodConverter.importExamples(value.schema, _definition4, 'example');
								body.definition = _definition4;
							}
							if (value.hasOwnProperty('examples') && !_.isEmpty(value.examples)) {
								var examples = value.examples;
								for (var _index in examples) {
									if (!examples.hasOwnProperty(_index) || examples[_index] == null) continue;
									if (!body.mimeType) body.mimeType = _index;
									var val = examples[_index];
									var _result = new Body();
									var _definition5 = new Definition();
									_definition5.examples = val;
									Oas20MethodConverter.importExamples({ examples: val }, _definition5, 'examples');
									_result.definition = _definition5;
									if (!body.definition) body.definition = new Definition();
									_.assign(body.definition, _result.definition);
								}
							}
							var bodies = _.isEmpty(body) ? [] : [body];
							response.bodies = bodies;
						}
						Oas20RootConverter.importAnnotations(value, response, this.model);
						responses.push(response);
					}
					model.responses = responses;
				}
			}

			if (oasDef.hasOwnProperty('externalDocs')) {
				var defExternalDocs = oasDef.externalDocs;
				var externalDocs = new ExternalDocumentation();
				if (defExternalDocs.hasOwnProperty('url')) externalDocs.url = defExternalDocs.url;
				if (defExternalDocs.hasOwnProperty('description')) externalDocs.description = defExternalDocs.description;
				if (!_.isEmpty(externalDocs)) {
					model.externalDocs = externalDocs;
				}
			}
			if (oasDef.hasOwnProperty('parameters')) {
				if (_.isArray(oasDef.parameters) && !_.isEmpty(oasDef.parameters)) {
					var _headers = [];
					var _bodies3 = [];
					var formBodies = [];
					var parameters = [];
					var is = [];
					for (var _index2 in oasDef.parameters) {
						if (!oasDef.parameters.hasOwnProperty(_index2)) continue;

						var isExternal = oasHelper.isFilePath(oasDef.parameters[_index2]);
						var dereferencedParam = this.dereferencedAPI ? this.currentMethod ? this.dereferencedAPI[this.currentMethod].parameters ? this.dereferencedAPI[this.currentMethod].parameters[_index2] : null : this.dereferencedAPI : null;
						var isInPath = this.resourcePath && dereferencedParam && dereferencedParam.in === 'path';
						var _val = (isExternal || isInPath) && dereferencedParam ? dereferencedParam : oasDef.parameters[_index2];
						if (_val.hasOwnProperty('$ref') && !isInPath) {
							var regex = /(trait:)(.*)(:.*)/;
							var traitName = stringsHelper.computeResourceDisplayName(_val.$ref);
							var match = traitName.match(regex);
							if (match) traitName = match[2];
							if (!is.map(function (object) {
								return object.name;
							}).includes(traitName)) {
								var item = new Item();
								item.name = traitName;
								is.push(item);
							}
							var parameter = new Parameter();
							parameter.reference = _val.$ref;
							parameters.push(parameter);
						} else {
							if (_val.hasOwnProperty('exclusiveMaximum')) {
								_val['x-oas-exclusiveMaximum'] = _val.exclusiveMaximum;
								delete _val.exclusiveMaximum;
							}
							if (_val.hasOwnProperty('exclusiveMinimum')) {
								_val['x-oas-exclusiveMinimum'] = _val.exclusiveMinimum;
								delete _val.exclusiveMinimum;
							}
							if (_val.hasOwnProperty('in') && _val.in === 'header') {
								var _header = new Header();
								_header._in = _val.in;
								_header.name = _val.name;
								if (_val.hasOwnProperty('description')) _header.description = _val.description;
								Oas20RootConverter.importAnnotations(_val, _header, this.model);
								var _definition6 = definitionConverter._import(_val);
								_header.definition = _definition6;
								Oas20MethodConverter.importRequired(_val, _header);
								_headers.push(_header);
							} else if (_val.hasOwnProperty('in') && _val.in === 'body') {
								var _body2 = new Body();
								if (_val.hasOwnProperty('description')) _body2.description = _val.description;
								if (_val.hasOwnProperty('name')) _body2.name = _val.name;
								Oas20RootConverter.importAnnotations(_val, _body2, this.model);
								var _definition7 = definitionConverter._import(_val.schema);
								_body2.definition = _definition7;
								Oas20MethodConverter.importRequired(_val, _body2);
								_bodies3.push(_body2);
							} else if (_val.hasOwnProperty('in') && _val.in === 'formData') {
								var _body3 = new Body();
								var _definition8 = definitionConverter._import(_val);
								_body3.definition = _definition8;
								if (_val.hasOwnProperty('description')) _body3.description = _val.description;
								Oas20RootConverter.importAnnotations(_val, _body3, this.model);
								Oas20MethodConverter.importRequired(_val, _body3);
								formBodies.push(_body3);
							} else if (_val.hasOwnProperty('in') && (_val.in === 'query' || _val.in === 'path')) {
								var _parameter2 = new Parameter();
								_parameter2._in = _val.in;
								_parameter2.name = _val.name;
								if (_parameter2.hasOwnProperty('description')) _parameter2.description = _val.description;
								Oas20RootConverter.importAnnotations(_val, _parameter2, this.model);
								var _definition9 = definitionConverter._import(_val);
								_parameter2.definition = _definition9;
								Oas20MethodConverter.importRequired(_val, _parameter2);
								if (_val.in === 'path' && this.model[this.resourcePath] && dereferencedParam && this.resourcePath.split('/').pop().includes(dereferencedParam.name)) {
									if (this.model[this.resourcePath].parameters) {
										this.model[this.resourcePath].parameters.push(_parameter2);
									} else {
										this.model[this.resourcePath].parameters = [_parameter2];
									}
								} else {
									parameters.push(_parameter2);
								}
							}
						}
					}
					model.headers = _headers;
					model.bodies = _bodies3;
					model.formBodies = formBodies;
					model.parameters = parameters;
					if (!_.isEmpty(is)) model.is = is;
				}
			}

			Oas20RootConverter.importAnnotations(oasDef, model, this.model);

			return model;
		}
	}], [{
		key: 'exportExamples',
		value: function exportExamples(source, target, mimeType, exampleKey) {
			switch (exampleKey) {
				case 'example':
					if (source.hasOwnProperty(exampleKey)) {
						if (!target.examples) target.examples = {};
						if (mimeType != null) target.examples[mimeType] = source.example;
						delete source.example;
					}
					break;
				case 'examples':
					if (source.hasOwnProperty(exampleKey)) {
						if (!target.examples) target.examples = {};
						if (mimeType != null) target.examples[mimeType] = source.examples;
						delete source.examples;
					}
					break;
			}
		}
	}, {
		key: 'exportRequired',
		value: function exportRequired(source, target) {
			target.required = source.required;
			if (target.hasOwnProperty('required') && !target.required) delete target.required;
		}
	}, {
		key: 'exportHeaders',
		value: function exportHeaders(object, converter) {
			var headers = [];

			if (object.hasOwnProperty('headers') && object.headers != null) {
				var headersModel = object.headers;
				if (_.isArray(headersModel) && !_.isEmpty(headersModel)) {
					for (var i = 0; i < headersModel.length; i++) {
						var value = headersModel[i];
						var definition = value.definition;
						var header = void 0;
						if (value.hasOwnProperty('reference')) {
							header = { $ref: value.reference };
						} else {
							header = Object.assign({}, converter._export(definition));
							header.in = value._in;
							if (definition != null) header.name = definition.name;
							if (!header.type) header.type = 'string';
							if (header.$ref) delete header.$ref;
							if (header.type === 'array' && !header.hasOwnProperty('items')) header.items = { type: 'string' };
							helper.removePropertiesFromObject(header, ['example']);
							Oas20MethodConverter.exportRequired(value, header);
							Oas20RootConverter.exportAnnotations(value, header);
						}
						headers.push(header);
					}
				}
			}

			return headers;
		}
	}, {
		key: 'exportParameters',
		value: function exportParameters(object, paramsType, converter) {
			var parameters = [];
			if (object.hasOwnProperty(paramsType)) {
				var parametersModel = paramsType === 'parameters' ? object.parameters : object.queryStrings;
				if (_.isArray(parametersModel) && !_.isEmpty(parametersModel) && parametersModel != null) {
					for (var i = 0; i < parametersModel.length; i++) {
						var value = parametersModel[i];
						var definition = value.definition;
						var parameter = void 0;
						if (value.hasOwnProperty('reference')) {
							parameter = { $ref: value.reference };
						} else if (paramsType === 'queryStrings' && definition != null && definition.hasOwnProperty('properties')) {
							var queryStrings = Oas20MethodConverter.exportMultipleQueryStrings(value, converter);
							if (!_.isEmpty(queryStrings)) parameters = parameters.concat(queryStrings);
						} else if (definition != null) {
							parameter = Object.assign({}, converter._export(definition));
							if (parameter.hasOwnProperty('items') && parameter.items.hasOwnProperty('$ref')) {
								parameter.items.type = 'string';
								delete parameter.items.$ref;
							}
							parameter.in = value._in;
							parameter.name = definition.name;
							Oas20MethodConverter.exportRequired(value, parameter);
							if (!parameter.type) parameter.type = 'string';
							if (parameter.$ref) delete parameter.$ref;
							if (parameter.type === 'array' && !parameter.hasOwnProperty('items')) parameter.items = { type: 'string' };
							if (parameter.hasOwnProperty('repeat')) delete parameter.repeat;
							helper.removePropertiesFromObject(parameter, ['example']);
							Oas20RootConverter.exportAnnotations(value, parameter);
							if (value.hasOwnProperty('hasParams')) parameter.hasParams = value.hasParams;
						}
						if (parameter) parameters.push(parameter);
					}
				}
			}

			return parameters;
		}
	}, {
		key: 'exportMultipleQueryStrings',
		value: function exportMultipleQueryStrings(object, converter) {
			var definition = object.definition;
			var queryStrings = [];
			if (definition != null && definition.properties != null) {
				var properties = definition.properties;
				for (var i = 0; i < properties.length; i++) {
					var value = properties[i];
					var name = value.name;
					var parameter = converter._export(value);
					if (definition.hasOwnProperty('propsRequired') && definition.propsRequired != null) {
						value.required = definition.propsRequired.indexOf(name) > -1;
					}
					parameter.in = object._in;
					parameter.name = name;
					Oas20MethodConverter.exportRequired(value, parameter);
					queryStrings.push(parameter);
				}
			}

			return queryStrings;
		}
	}, {
		key: 'createOasDef',
		value: function createOasDef(method, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, method);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				var value = result[id];
				if (value != null) {
					result[attrIdMap[id]] = result[id];
					delete result[id];
				}
			});

			return result;
		}
	}, {
		key: 'createMethod',
		value: function createMethod(oasDef, attrIdMap, attrIdSkip, annotationPrefix) {
			var object = {};

			_.entries(oasDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-') && !key.startsWith(annotationPrefix)) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Method();
			_.assign(result, object);

			return result;
		}
	}, {
		key: 'importRequired',
		value: function importRequired(source, target) {
			target.required = source.hasOwnProperty('required') ? source.required : false;
		}
	}, {
		key: 'importExamples',
		value: function importExamples(source, target, property) {
			var isJson = false;
			try {
				switch (property) {
					case 'example':
						{
							var example = JSON.parse(source.example);
							if (typeof source.example === 'string') {
								target.example = example;
							} else if (source.example === null) {
								delete target.example;
							}
							break;
						}
					case 'examples':
						{
							isJson = _.startsWith(source.examples, '{');
							var examples = JSON.parse(source.examples);
							if (typeof source.examples === 'string') {
								target.examples = examples;
							} else if (source.examples === null) {
								delete target.examples;
							}
							break;
						}
				}
			} catch (e) {
				if (isJson) {
					target.invalidJsonExample = true;
				}
			}
		}
	}]);

	return Oas20MethodConverter;
}(Converter);

module.exports = Oas20MethodConverter;