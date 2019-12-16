'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Parameter = ConverterModel.Parameter;
var Method = ConverterModel.Method;
var Root = ConverterModel.Root;
var Response = ConverterModel.Response;
var Body = ConverterModel.Body;
var ResourceType = ConverterModel.ResourceType;
var Trait = ConverterModel.Trait;
var Item = ConverterModel.Item;
var Header = ConverterModel.Header;
var Resource = ConverterModel.Resource;
var Converter = require('../converters/converter');
var parser = require('swagger-parser');
var Oas20RootConverter = require('../oas20/oas20RootConverter');
var Oas20SecurityDefinitionConverter = require('../oas20/oas20SecurityDefinitionConverter');
var Oas20ResourceConverter = require('../oas20/oas20ResourceConverter');
var Oas20DefinitionConverter = require('../oas20/oas20DefinitionConverter');
var Oas20TraitConverter = require('../oas20/oas20TraitConverter');
var YAML = require('js-yaml');
var jsonHelper = require('../utils/json');

var Oas20Converter = function (_Converter) {
	_inherits(Oas20Converter, _Converter);

	function Oas20Converter() {
		_classCallCheck(this, Oas20Converter);

		return _possibleConstructorReturn(this, (Oas20Converter.__proto__ || Object.getPrototypeOf(Oas20Converter)).apply(this, arguments));
	}

	_createClass(Oas20Converter, [{
		key: '_loadFile',
		value: function _loadFile(filePath, options) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				var validateOptions = _.cloneDeep(options || {});
				var validate = options && (options.validate === true || options.validateImport === true);
				validateOptions.validate = { schema: validate, spec: validate };

				var dataCopy = _.cloneDeep(filePath);
				parser.validate(dataCopy, validateOptions).then(function () {
					_this2._doParseData(filePath, options || {}, resolve, reject);
				}).catch(reject);
			});
		}
	}, {
		key: '_loadData',
		value: function _loadData(data, options) {
			var _this3 = this;

			return new Promise(function (resolve, reject) {
				var dataObject = YAML.safeLoad(data);
				parser.parse(dataObject, options).then(function (api) {
					_this3._doParseData(api, options || {}, resolve, reject);
				}).catch(reject);
			});
		}
	}, {
		key: '_doParseData',
		value: function _doParseData(dataOrPath, options, resolve, reject) {
			var _this4 = this;

			// without validation
			parser.parse(dataOrPath, options).then(function (api) {
				JSON.parse(JSON.stringify(api));

				_this4.data = api;
				var parseFn = void 0;
				if (typeof dataOrPath === 'string') {
					parseFn = parser.dereference(dataOrPath, JSON.parse(JSON.stringify(api)), options);
				} else {
					parseFn = parser.dereference(JSON.parse(JSON.stringify(api)), options);
				}

				parseFn.then(function (dereferencedAPI) {
					if (options && options.expand) {
						_this4.data = dereferencedAPI;
					} else {
						_this4.data.dereferencedAPI = dereferencedAPI;
					}
					resolve();
				}).catch(reject);
			}).catch(reject);
		}
	}, {
		key: 'export',
		value: function _export(model, format) {
			return new Promise(function (resolve, reject) {
				try {
					Oas20Converter.fixInheritedProperties(model);

					var rootConverter = new Oas20RootConverter();
					var oasDef = { swagger: '2.0' };
					_.assign(oasDef, rootConverter.export(model));
					if (model.hasOwnProperty('securityDefinitions') && model.securityDefinitions) {
						var securityDefinitionConverter = new Oas20SecurityDefinitionConverter();
						var securityDef = securityDefinitionConverter.export(model.securityDefinitions);
						if (!_.isEmpty(securityDef)) oasDef.securityDefinitions = securityDef;
					}
					var definitionConverter = new Oas20DefinitionConverter();
					if (model.hasOwnProperty('types')) oasDef.definitions = definitionConverter.export(model.types);
					var traitConverter = new Oas20TraitConverter();
					if (model.hasOwnProperty('traits') && model.traits) {
						var traitsDef = traitConverter.export(model.traits);
						if (!_.isEmpty(traitsDef.parameters)) oasDef.parameters = traitsDef.parameters;
						if (!_.isEmpty(traitsDef.responses)) oasDef.responses = traitsDef.responses;
					}
					var resourceConverter = new Oas20ResourceConverter(model, null, oasDef);
					if (model.hasOwnProperty('resources') && model.resources) {
						oasDef.paths = resourceConverter.export(model.resources);
					} else {
						oasDef.paths = {};
					}

					resolve(Oas20Converter._getData(oasDef, format));
				} catch (err) {
					reject(err);
				}
			});
		}
	}, {
		key: 'import',
		value: function _import(oasDef) {
			var rootConverter = new Oas20RootConverter();
			var model = rootConverter.import(oasDef);
			var securityDefinitionConverter = new Oas20SecurityDefinitionConverter(model, oasDef.dereferencedAPI.securityDefinitions);
			if (oasDef.hasOwnProperty('securityDefinitions') && !_.isEmpty(oasDef.securityDefinitions)) model.securityDefinitions = securityDefinitionConverter.import(oasDef.securityDefinitions);
			var definitionConverter = new Oas20DefinitionConverter(model, '', oasDef);
			if (oasDef.hasOwnProperty('definitions')) model.types = definitionConverter.import(oasDef.definitions);
			var traitConverter = new Oas20TraitConverter(model, oasDef.dereferencedAPI.parameters);
			if (oasDef.hasOwnProperty('parameters') || oasDef.hasOwnProperty('responses')) {
				model.traits = traitConverter.import({
					parameters: oasDef.parameters,
					responses: oasDef.responses
				});
			}
			var resourceConverter = new Oas20ResourceConverter(model, oasDef.dereferencedAPI.paths, oasDef);
			var paths = {};
			Object.keys(oasDef.paths).sort().forEach(function (path) {
				return paths[path] = oasDef.paths[path];
			});
			if (oasDef.hasOwnProperty('paths')) model.resources = resourceConverter.import(paths);

			return model;
		}
	}], [{
		key: 'fixInheritedProperties',
		value: function fixInheritedProperties(model) {
			var map = [];
			var resourceTypes = model.resourceTypes;
			var traits = model.traits;
			if (model.hasOwnProperty('resources') && model.resources) {
				var resources = model.resources;
				for (var i = 0; i < resources.length; i++) {
					var resource = resources[i];
					if (resource.hasOwnProperty('resourceType')) {
						var resourceType = resource.resourceType;
						if (resourceType != null && resourceTypes) {
							var _loop = function _loop(j) {
								var type = resourceType[j];
								var usedTypeName = type.name;
								var usedResourceType = resourceTypes.filter(function (rt) {
									return usedTypeName === rt.name;
								})[0];
								if (!usedResourceType) return 'continue';

								var usedResource = usedResourceType.resource;
								if (usedResource && usedResource.hasOwnProperty('parameters') && usedResource.parameters) {
									var parameters = usedResource.parameters;
									for (var k = 0; k < parameters.length; k++) {
										var parameter = parameters[k];
										var item = {
											type: 'uriParameter',
											name: parameter.name,
											resource: resource.path,
											params: null
										};
										map.push(item);
									}
								}
								if (usedResource && usedResource.hasOwnProperty('methods') && usedResource.methods) {
									var methods = usedResource.methods;
									for (var _k = 0; _k < methods.length; _k++) {
										var method = methods[_k];
										Oas20Converter.mapMethodProperties(map, method, null, resource.path, method.method, type.value);
									}
								}
							};

							for (var j = 0; j < resourceType.length; j++) {
								var _ret = _loop(j);

								if (_ret === 'continue') continue;
							}
						}
					}
					if (resource.hasOwnProperty('is') && resource.is && traits) {
						var isList = resource.is;

						var _loop2 = function _loop2(j) {
							var is = isList[j];
							var usedTraitName = is.name;
							var usedTrait = traits.filter(function (trait) {
								return usedTraitName === trait.name;
							})[0];
							if (usedTrait && usedTrait.method) Oas20Converter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, 'all', is.value);
						};

						for (var j = 0; j < isList.length; j++) {
							_loop2(j);
						}
					}
					if (resource.hasOwnProperty('methods') && resource.methods) {
						var methods = resource.methods;
						for (var j = 0; j < methods.length; j++) {
							var method = methods[j];
							if (method.hasOwnProperty('is') && method.is && traits) {
								var _isList = method.is;

								var _loop3 = function _loop3(k) {
									var is = _isList[k];
									var usedTraitName = is.name;
									var usedTrait = traits.filter(function (trait) {
										return usedTraitName === trait.name;
									})[0];
									if (usedTrait && usedTrait.method) Oas20Converter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, method.method, is.value);
								};

								for (var k = 0; k < _isList.length; k++) {
									_loop3(k);
								}
							}
						}
					}
				}

				var _loop4 = function _loop4(_i) {
					var item = map[_i];
					var userResource = resources.filter(function (resource) {
						return resource.path === item.resource;
					})[0];
					if (!userResource.hasOwnProperty('methods')) return 'continue';
					if (userResource.methods) {
						var userMethods = userResource.methods.filter(function (method) {
							return item.method === 'all' || method.method === item.method;
						});
						for (var m = 0; m < userMethods.length; m++) {
							var userMethod = userMethods[m];
							if (item.type === 'header' && userMethod && userMethod.headers != null && item.trait) {
								var headers = userMethod.headers;
								var headerNames = headers.map(function (header) {
									return header.name;
								});
								if (headerNames.includes(item.name)) {
									headers.splice(headerNames.indexOf(item.name), 1);
									var header = new Header();
									var trait = item.trait ? item.trait : '';
									header.reference = '#/parameters/trait:' + trait + ':' + item.name;
									headers.push(header);
								}
							} else if (item.type === 'queryParameter' && userMethod && userMethod.parameters && item.trait) {
								var parameters = userMethod.parameters;
								var parameterNames = parameters.map(function (parameter) {
									return parameter.name;
								});
								if (parameterNames.includes(item.name)) {
									parameters.splice(parameterNames.indexOf(item.name), 1);
									var parameter = new Parameter();
									var _trait = item.trait ? item.trait : '';
									parameter.reference = '#/parameters/trait:' + _trait + ':' + item.name;
									parameters.push(parameter);
								}
							} else if (item.type === 'response' && userMethod && userMethod.responses && item.trait) {
								var responses = userMethod.responses;
								var responseCodes = responses.map(function (response) {
									return response.httpStatusCode;
								});
								if (responseCodes.includes(item.name)) {
									responses.splice(responseCodes.indexOf(item.name), 1);
									var response = new Response();
									response.httpStatusCode = item.name;
									response.reference = '#/responses/trait:' + item.trait + ':' + item.name;
									responses.push(response);
									var produces = userMethod.produces ? userMethod.produces : [];
									for (var _m in item.mimeTypes) {
										if (!produces.includes(item.mimeTypes[_m])) produces.push(item.mimeTypes[_m]);
										userMethod.produces = produces;
									}
								}
							}
						}
					}
				};

				for (var _i = 0; _i < map.length; _i++) {
					var _ret4 = _loop4(_i);

					if (_ret4 === 'continue') continue;
				}
			}
		}
	}, {
		key: 'mapMethodProperties',
		value: function mapMethodProperties(map, method, traitName, resourcePath, methodName, params) {
			if (method.hasOwnProperty('bodies') && method.bodies != null) {
				var bodies = method.bodies;
				for (var i = 0; i < bodies.length; i++) {
					var body = bodies[i];
					if (!body.hasParams) {
						var _item = {
							type: 'body',
							trait: traitName,
							name: body.mimeType,
							resource: resourcePath,
							method: methodName,
							params: params
						};
						map.push(_item);
					}
				}
			}
			if (method.hasOwnProperty('headers') && method.headers != null) {
				var headers = method.headers;
				for (var _i2 = 0; _i2 < headers.length; _i2++) {
					var header = headers[_i2];
					if (!header.hasParams) {
						var _item2 = {
							type: 'header',
							trait: traitName,
							name: header.name,
							resource: resourcePath,
							method: methodName,
							params: params
						};
						map.push(_item2);
					}
				}
			}
			if (method.hasOwnProperty('parameters') && method.parameters != null) {
				var parameters = method.parameters;
				for (var _i3 = 0; _i3 < parameters.length; _i3++) {
					var parameter = parameters[_i3];
					if (!parameter.hasParams) {
						var _item3 = {
							type: 'queryParameter',
							trait: traitName,
							name: parameter.name,
							resource: resourcePath,
							method: methodName,
							params: params
						};
						map.push(_item3);
					}
				}
			}
			if (method.hasOwnProperty('responses') && method.responses != null) {
				var responses = method.responses;
				for (var _i4 = 0; _i4 < responses.length; _i4++) {
					var response = responses[_i4];
					var mimeTypes = response.bodies ? response.bodies.map(function (body) {
						return body.mimeType;
					}) : [];
					if (!response.hasParams) {
						var _item4 = {
							type: 'response',
							name: response.httpStatusCode,
							resource: resourcePath,
							method: methodName,
							mimeTypes: mimeTypes,
							params: params
						};
						if (traitName) _item4.trait = traitName;
						map.push(_item4);
					}
				}
			}
		}
	}, {
		key: '_getData',
		value: function _getData(oasDef, format) {
			if (format === 'yaml') return YAML.dump(jsonHelper.parse(oasDef));

			if (format === 'json') return jsonHelper.stringify(oasDef, 2);
		}
	}]);

	return Oas20Converter;
}(Converter);

module.exports = Oas20Converter;