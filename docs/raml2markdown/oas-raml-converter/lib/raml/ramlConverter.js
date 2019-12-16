'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Converter = require('../converters/converter');
var ConverterModel = require('oas-raml-converter-model');
var Root = ConverterModel.Root;
var Resource = ConverterModel.Resource;
var ResourceType = ConverterModel.ResourceType;
var Parameter = ConverterModel.Parameter;
var Trait = ConverterModel.Trait;
var Method = ConverterModel.Method;
var Item = ConverterModel.Item;
var Body = ConverterModel.Body;
var Header = ConverterModel.Header;
var Response = ConverterModel.Response;
var parser = require('raml-1-parser');
var RamlRootConverter = require('../raml/ramlRootConverter');
var RamlSecurityDefinitionConverter = require('../raml/ramlSecurityDefinitionConverter');
var RamlResourceConverter = require('../raml/ramlResourceConverter');
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var RamlResourceTypeConverter = require('../raml/ramlResourceTypeConverter');
var RamlTraitConverter = require('../raml/ramlTraitConverter');
var RamlAnnotationTypeConverter = require('../raml/ramlAnnotationTypeConverter');
var helper = require('../helpers/raml');
var YAML = require('js-yaml');
var fs = require('fs');
var toJSONOptions = { serializeMetadata: false, sourceMap: true };
var RamlErrorModel = require('../helpers/ramlErrorModel');
var jsonHelper = require('../utils/json');
var path = require('path');

var RamlConverter = function (_Converter) {
	_inherits(RamlConverter, _Converter);

	function RamlConverter() {
		_classCallCheck(this, RamlConverter);

		return _possibleConstructorReturn(this, (RamlConverter.__proto__ || Object.getPrototypeOf(RamlConverter)).apply(this, arguments));
	}

	_createClass(RamlConverter, [{
		key: '_loadFile',
		value: function _loadFile(filePath, options) {
			var _this2 = this;

			this.filePath = filePath;
			var fileContent = fs.readFileSync(filePath, 'utf8');

			this.format = RamlConverter.detectFormat(fileContent);
			return new Promise(function (resolve, reject) {
				parser.loadApi(filePath, Converter._options(options)).then(function (api) {
					try {
						var errors = api.errors();
						if (!_.isEmpty(errors)) _this2.errors = jsonHelper.parse(errors);
						_this2.data = api.expand(true).toJSON(toJSONOptions);
						_this2._removeSourceMapLocalRef(_this2.data, path.basename(filePath));
						resolve();
					} catch (e) {
						reject(e);
					}
				}, function (error) {
					reject(error);
				});
			});
		}
	}, {
		key: '_loadData',
		value: function _loadData(data, options) {
			var _this3 = this;

			this.fileContent = data;
			this.format = RamlConverter.detectFormat(data);
			if (options && (!options.hasOwnProperty('attributeDefaults') || options.attributeDefaults)) options.attributeDefaults = false;
			return new Promise(function (resolve, reject) {
				var parsedData = parser.parseRAMLSync(data, options);
				if (parsedData.name === 'Error') {
					reject();
				} else {
					var errors = parsedData.errors();
					if (!_.isEmpty(errors)) _this3.errors = jsonHelper.parse(errors);
					_this3.data = parsedData.expand(true).toJSON(toJSONOptions);
					_this3._removeSourceMapLocalRef(_this3.data, '#local.raml');
					resolve();
				}
			});
		}
	}, {
		key: '_removeSourceMapLocalRef',
		value: function _removeSourceMapLocalRef(ramlDef, filePath) {
			if (!_.isEmpty(ramlDef) && (typeof ramlDef === 'undefined' ? 'undefined' : _typeof(ramlDef)) === 'object' && ramlDef.hasOwnProperty('sourceMap') && ramlDef['sourceMap'].hasOwnProperty('path')) {
				if (ramlDef['sourceMap']['path'] === '#local.raml' || ramlDef['sourceMap']['path'] === filePath) {
					delete ramlDef['sourceMap'];
				} else {
					if (ramlDef.hasOwnProperty('properties')) {
						this._removeSourceMapRecursive(ramlDef['properties'], ramlDef['sourceMap']['path']);
					}
					if (ramlDef.hasOwnProperty('queryParameters')) {
						this._removeSourceMapRecursive(ramlDef['queryParameters'], ramlDef['sourceMap']['path']);
					}
					if (ramlDef.hasOwnProperty('headers')) {
						this._removeSourceMapRecursive(ramlDef['headers'], ramlDef['sourceMap']['path']);
					}
					if (ramlDef.hasOwnProperty('responses')) {
						this._removeSourceMapRecursive(ramlDef['responses'], ramlDef['sourceMap']['path']);
					}
				}
			}

			for (var id in ramlDef) {
				if (!ramlDef.hasOwnProperty(id)) continue;
				var value = ramlDef[id];

				if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
					this._removeSourceMapLocalRef(value, filePath);
				}
			}
		}
	}, {
		key: '_removeSourceMapRecursive',
		value: function _removeSourceMapRecursive(ramlDef, pathId) {
			for (var id in ramlDef) {
				if (!ramlDef.hasOwnProperty(id)) continue;
				var value = ramlDef[id];

				if (id === 'sourceMap' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.hasOwnProperty('path') && value['path'] === pathId) {
					delete ramlDef[id];
					continue;
				}

				if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
					this._removeSourceMapRecursive(value, pathId);
				}
			}
		}
	}, {
		key: 'export',
		value: function _export(model) {
			return new Promise(function (resolve, reject) {
				try {
					RamlConverter.fixInheritedProperties(model);

					var rootConverter = new RamlRootConverter(model);
					var ramlDef = {};
					_.assign(ramlDef, rootConverter.export(model));
					var securityDefinitionConverter = new RamlSecurityDefinitionConverter(model, rootConverter.annotationPrefix, ramlDef);
					if (model.securityDefinitions) ramlDef.securitySchemes = securityDefinitionConverter.export(model.securityDefinitions);
					var definitionConverter = new RamlDefinitionConverter(model, rootConverter.annotationPrefix, ramlDef);
					if (model.types) ramlDef.types = definitionConverter.export(model.types);
					var resourceTypeConverter = new RamlResourceTypeConverter(model);
					if (model.resourceTypes) ramlDef.resourceTypes = resourceTypeConverter.export(model.resourceTypes);
					var traitConverter = new RamlTraitConverter(model, rootConverter.annotationPrefix, ramlDef);
					if (model.traits) ramlDef.traits = traitConverter.export(model);
					if (ramlDef.traits && _.isEmpty(ramlDef.traits)) delete ramlDef.traits;
					var annotationTypeConverter = new RamlAnnotationTypeConverter(model, rootConverter.annotationPrefix, ramlDef);
					if (model.annotationTypes) ramlDef.annotationTypes = annotationTypeConverter.export(model.annotationTypes);
					var resourceConverter = new RamlResourceConverter(model, rootConverter.annotationPrefix, ramlDef);
					if (model.resources) _.merge(ramlDef, resourceConverter.export(model.resources));

					resolve(RamlConverter.getData(ramlDef));
				} catch (err) {
					reject(err);
				}
			});
		}
	}, {
		key: 'import',
		value: function _import(ramlDef, addErrorsToModel) {
			var rootConverter = new RamlRootConverter(new Root());
			rootConverter.version = this.format;
			var model = rootConverter.import(ramlDef);
			var securityDefinitionConverter = new RamlSecurityDefinitionConverter();
			if (ramlDef.securitySchemes) model.securityDefinitions = securityDefinitionConverter.import(ramlDef.securitySchemes);
			var definitionConverter = new RamlDefinitionConverter(model, null, ramlDef);
			definitionConverter.version = this.format;
			var types = ramlDef.types ? ramlDef.types : ramlDef.schemas;
			if (types) model.types = definitionConverter.import(types);
			var resourceTypeConverter = new RamlResourceTypeConverter();
			resourceTypeConverter.version = this.format;
			if (ramlDef.resourceTypes) model.resourceTypes = resourceTypeConverter.import(ramlDef.resourceTypes);
			var traitConverter = new RamlTraitConverter();
			traitConverter.version = this.format;
			if (ramlDef.traits) model.traits = traitConverter.import(ramlDef.traits);
			var resourceConverter = new RamlResourceConverter(model, null, ramlDef);
			resourceConverter.version = this.format;
			if (ramlDef.resources) model.resources = resourceConverter.import(ramlDef.resources);
			var annotationTypeConverter = new RamlAnnotationTypeConverter(model);
			if (ramlDef.annotationTypes) model.annotationTypes = annotationTypeConverter.import(ramlDef.annotationTypes);

			//add errors to model
			if (addErrorsToModel && !_.isEmpty(this.errors)) {
				try {
					var ramlErrorModel = new RamlErrorModel();
					if (this.filePath) ramlErrorModel.addErrorNodesFromPath(this.filePath, model, this.errors);else ramlErrorModel.addErrorNodesFromContent(this.fileContent, model, this.errors);
				} catch (e) {
					//ignore
					console.log(e);
				}
			}

			return model;
		}
	}], [{
		key: 'detectFormat',
		value: function detectFormat(data) {
			if (!data) return;
			data = _.trim(data);

			if (/#%RAML[\s]*1\.?0?/.test(data)) return 'RAML10';
			if (/#%RAML[\s]*0\.?8?/.test(data)) return 'RAML08';
		}
	}, {
		key: 'fixInheritedProperties',
		value: function fixInheritedProperties(model) {
			var map = [];
			var resourceTypes = model.resourceTypes;
			var traits = model.traits;
			if (model.hasOwnProperty('resources') && model.resources) {
				var resources = model.resources;
				for (var i = 0; i < resources.length; i++) {
					var resource = resources[i];
					if (resource.hasOwnProperty('resourceType') && resource.resourceType && resourceTypes) {
						var resourceType = resource.resourceType;

						var _loop = function _loop(j) {
							var type = resourceType[j];
							var usedTypeName = type.name;
							var usedResourceType = resourceTypes.filter(function (resourceType) {
								return usedTypeName === resourceType.name;
							})[0];
							var usedResource = usedResourceType.resource;
							if (usedResource && usedResource.hasOwnProperty('parameters') && usedResource.parameters) {
								var parameters = usedResource.parameters;
								for (var k = 0; i < parameters.length; i++) {
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
									RamlConverter.mapMethodProperties(map, method, null, resource.path, method.method, type.value);
								}
							}
						};

						for (var j = 0; j < resourceType.length; j++) {
							_loop(j);
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
							if (usedTrait && usedTrait.method) RamlConverter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, 'all', is.value);
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
									if (usedTrait && usedTrait.method) RamlConverter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, method.method, is.value);
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
					if (userResource.hasOwnProperty('methods') && userResource.methods) {
						var userMethod = userResource.methods.filter(function (method) {
							return item.method === 'all' || method.method === item.method;
						})[0];
						if (item.type === 'body' && userMethod.bodies) {
							var bodyMimeTypes = [];
							for (var _j = 0; _j < userMethod.bodies.length; _j++) {
								bodyMimeTypes.push(userMethod.bodies[_j].mimeType);
							}
							if (item.name && bodyMimeTypes.includes(item.name) && userMethod.hasOwnProperty('bodies')) {
								var bodies = userMethod.bodies;
								bodies.splice(bodyMimeTypes.indexOf(item.name), 1);
							}
						} else if (item.type === 'header' && userMethod.headers) {
							var headerNames = userMethod.headers.map(function (header) {
								return header.name;
							});
							if (headerNames.includes(item.name) && userMethod.headers) userMethod.headers.splice(headerNames.indexOf(item.name), 1);
						} else if (item.type === 'queryParameter' && userMethod.parameters) {
							var parameterNames = userMethod.parameters.map(function (parameter) {
								return parameter.name;
							});
							if (parameterNames.includes(item.name) && userMethod.parameters) userMethod.parameters.splice(parameterNames.indexOf(item.name), 1);
						} else if (item.type === 'uriParameter' && userResource.parameters) {
							var _parameterNames = userResource.parameters.map(function (parameter) {
								return parameter.name;
							});
							if (_parameterNames.includes(item.name) && userResource.parameters) userResource.parameters.splice(_parameterNames.indexOf(item.name), 1);
						} else if (item.type === 'response' && userMethod.responses) {
							var responseCodes = userMethod.responses.map(function (response) {
								return response.httpStatusCode;
							});
							if (responseCodes.includes(item.name) && userMethod.responses) userMethod.responses.splice(responseCodes.indexOf(item.name), 1);
						}
					}
				};

				for (var _i = 0; _i < map.length; _i++) {
					_loop4(_i);
				}
			}
		}
	}, {
		key: 'getData',
		value: function getData(ramlDef) {
			return '#%RAML 1.0\n' + helper.unescapeYamlIncludes(YAML.dump(JSON.parse(JSON.stringify(ramlDef)), { lineWidth: -1 }));
		}
	}, {
		key: 'mapMethodProperties',
		value: function mapMethodProperties(map, method, traitName, resourcePath, methodName, params) {
			if (method.hasOwnProperty('bodies') && method.bodies != null) {
				var bodies = method.bodies;

				for (var l = 0; l < bodies.length; l++) {
					var body = bodies[l];
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
			if (method.hasOwnProperty('headers') && method.headers != null) {
				var headers = method.headers;
				for (var _l = 0; _l < headers.length; _l++) {
					var header = headers[_l];
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
			if (method.hasOwnProperty('parameters') && method.parameters != null) {
				var parameters = method.parameters;
				for (var _l2 = 0; _l2 < parameters.length; _l2++) {
					var parameter = parameters[_l2];
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
			if (method.hasOwnProperty('responses') && method.responses != null) {
				var responses = method.responses;
				for (var _l3 = 0; _l3 < responses.length; _l3++) {
					var response = responses[_l3];
					if (response.bodies) {
						var mimeTypes = response.bodies.map(function (body) {
							return body.mimeType;
						});
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
	}]);

	return RamlConverter;
}(Converter);

module.exports = RamlConverter;