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

var Oas30RootConverter = require('./oas30RootConverter');
var Oas30SecurityDefinitionConverter = require('./oas30SecurityDefinitionConverter');
var Oas30DefinitionConverter = require('./oas30DefinitionConverter');
var Oas30TraitConverter = require('./oas30TraitConverter');
var Oas30ResourceConverter = require('./oas30ResourceConverter');

var Oas30Converter = function (_Converter) {
	_inherits(Oas30Converter, _Converter);

	function Oas30Converter() {
		_classCallCheck(this, Oas30Converter);

		return _possibleConstructorReturn(this, (Oas30Converter.__proto__ || Object.getPrototypeOf(Oas30Converter)).apply(this, arguments));
	}

	_createClass(Oas30Converter, [{
		key: 'export',
		value: function _export(model) {
			return new Promise(function (resolve, reject) {
				try {
					Oas30Converter.fixInheritedProperties(model);

					var rootConverter = new Oas30RootConverter();
					var oasDef = rootConverter.export(model);

					if (model.securityDefinitions != null) {
						var securityDefinitionConverter = new Oas30SecurityDefinitionConverter();
						var securityDef = securityDefinitionConverter.export(model.securityDefinitions);
						var components = oasDef.components;
						if (!_.isEmpty(securityDef)) components.securitySchemes = securityDef;
					}

					if (model.types != null) {
						var definitionConverter = new Oas30DefinitionConverter(model, null, oasDef);
						oasDef.components.schemas = definitionConverter.export(model.types);
					}

					if (model.traits != null) {
						var traitConverter = new Oas30TraitConverter();
						var traitsDef = traitConverter.export(model.traits);
						oasDef.components.parameters = traitsDef.parameters;
						oasDef.components.responses = traitsDef.responses;
					}

					if (model.resources != null) {
						var resourceConverter = new Oas30ResourceConverter(model, null, oasDef);
						oasDef.paths = resourceConverter.export(model.resources);
					} else {
						oasDef.paths = {};
					}

					resolve(oasDef);
				} catch (err) {
					reject(err);
				}
			});
		}
	}], [{
		key: 'fixInheritedProperties',
		value: function fixInheritedProperties(model) {
			var map = [];
			var resourceTypes = model.resourceTypes;
			var traits = model.traits;
			if (model.resources != null) {
				var resources = model.resources;
				for (var i = 0; i < resources.length; i++) {
					var resource = resources[i];
					if (resource.hasOwnProperty('resourceType')) {
						var resourceType = resource.resourceType;
						if (resourceType != null && resourceTypes != null) {
							var _loop = function _loop(j) {
								var type = resourceType[j];
								var usedTypeName = type.name;
								var usedResourceType = resourceTypes.filter(function (rt) {
									return usedTypeName === rt.name;
								})[0];
								if (!usedResourceType) return 'continue';

								var usedResource = usedResourceType.resource;
								if (usedResource && usedResource.parameters != null) {
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
								if (usedResource && usedResource.methods != null) {
									var methods = usedResource.methods;
									for (var _k = 0; _k < methods.length; _k++) {
										var method = methods[_k];
										Oas30Converter.mapMethodProperties(map, method, null, resource.path, method.method, type.value);
									}
								}
							};

							for (var j = 0; j < resourceType.length; j++) {
								var _ret = _loop(j);

								if (_ret === 'continue') continue;
							}
						}
					}
					if (resource.is != null && traits != null) {
						var isList = resource.is;

						var _loop2 = function _loop2(j) {
							var is = isList[j];
							var usedTraitName = is.name;
							var usedTrait = traits.filter(function (trait) {
								return usedTraitName === trait.name;
							})[0];
							if (usedTrait && usedTrait.method) Oas30Converter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, 'all', is.value);
						};

						for (var j = 0; j < isList.length; j++) {
							_loop2(j);
						}
					}
					if (resource.methods != null) {
						var methods = resource.methods;
						for (var j = 0; j < methods.length; j++) {
							var method = methods[j];
							if (method.is != null && traits != null) {
								var _isList = method.is;

								var _loop3 = function _loop3(k) {
									var is = _isList[k];
									var usedTraitName = is.name;
									var usedTrait = traits.filter(function (trait) {
										return usedTraitName === trait.name;
									})[0];
									if (usedTrait && usedTrait.method) Oas30Converter.mapMethodProperties(map, usedTrait.method, usedTrait.name, resource.path, method.method, is.value);
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
					if (userResource.methods != null) {
						var userMethods = userResource.methods.filter(function (method) {
							return item.method === 'all' || method.method === item.method;
						});
						for (var m = 0; m < userMethods.length; m++) {
							var userMethod = userMethods[m];
							if (item.type === 'header' && userMethod != null && userMethod.headers != null && item.trait != null) {
								var headers = userMethod.headers;
								var headerNames = headers.map(function (header) {
									return header.name;
								});
								if (headerNames.includes(item.name)) {
									headers.splice(headerNames.indexOf(item.name), 1);
									var header = new Header();
									var trait = item.trait ? item.trait : '';
									header.reference = '#/components/parameters/trait_' + trait + '_' + item.name;
									headers.push(header);
								}
							} else if (item.type === 'queryParameter' && userMethod != null && userMethod.parameters != null && item.trait != null) {
								var parameters = userMethod.parameters;
								var parameterNames = parameters.map(function (parameter) {
									return parameter.name;
								});
								if (parameterNames.includes(item.name)) {
									parameters.splice(parameterNames.indexOf(item.name), 1);
									var parameter = new Parameter();
									var _trait = item.trait ? item.trait : '';
									parameter.reference = '#/components/parameters/trait_' + _trait + '_' + item.name;
									parameters.push(parameter);
								}
							} else if (item.type === 'response' && userMethod != null && userMethod.responses != null && item.trait != null) {
								var responses = userMethod.responses;
								var responseCodes = responses.map(function (response) {
									return response.httpStatusCode;
								});
								if (responseCodes.includes(item.name)) {
									responses.splice(responseCodes.indexOf(item.name), 1);
									var response = new Response();
									response.httpStatusCode = item.name;
									response.reference = '#/components/responses/trait_' + item.trait + '_' + item.name;
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
			if (method.bodies != null) {
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
			if (method.headers != null) {
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
			if (method.parameters != null) {
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
			if (method.responses != null) {
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
	}]);

	return Oas30Converter;
}(Converter);

module.exports = Oas30Converter;