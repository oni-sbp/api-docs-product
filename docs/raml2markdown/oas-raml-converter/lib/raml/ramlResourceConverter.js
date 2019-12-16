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
var Body = ConverterModel.Body;
var Header = ConverterModel.Header;
var SecurityRequirement = ConverterModel.SecurityRequirement;
var Parameter = ConverterModel.Parameter;
var Item = ConverterModel.Item;
var Converter = require('../converters/converter');
var RamlMethodConverter = require('../raml/ramlMethodConverter');
var RamlAnnotationConverter = require('../raml/ramlAnnotationConverter');
var ParameterConverter = require('../common/parameterConverter');
var helper = require('../helpers/converter');
var ramlHelper = require('../helpers/raml');

var RamlResourceConverter = function (_Converter) {
	_inherits(RamlResourceConverter, _Converter);

	function RamlResourceConverter() {
		_classCallCheck(this, RamlResourceConverter);

		return _possibleConstructorReturn(this, (RamlResourceConverter.__proto__ || Object.getPrototypeOf(RamlResourceConverter)).apply(this, arguments));
	}

	_createClass(RamlResourceConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var path = model.path;
				if (path && path.startsWith('/')) {
					var paths = path.split('/');
					paths.shift();
					var relativePath = path.substring(path.lastIndexOf('/'));
					var resource = this.mapResource(model, result, paths, relativePath).result;
					if (resource) result = resource;
				}
			}

			return RamlResourceConverter.reduceResources(result);
		}
	}, {
		key: 'mapResource',
		value: function mapResource(model, result, paths, relativePath) {
			var path = paths.shift();
			path = '/' + path;
			if (!_.includes(Object.keys(result), path)) {
				if (path !== relativePath) {
					var value = this.mapResource(model, {}, paths, relativePath);
					result[path] = value.result;
					if (!_.isEmpty(value.uriParameters)) {
						var uriParameters = result[path].uriParameters ? result[path].uriParameters : {};
						RamlResourceConverter.mapUriParameters(value.uriParameters, path, uriParameters, result[path]);
					}
					return { result: result, uriParameters: value.uriParameters };
				} else {
					var _value = this._export(model);
					result[path] = _value.result;
					return { result: result, uriParameters: _value.uriParameters };
				}
			} else if (paths.length > 0) {
				var _value2 = this.mapResource(model, result[path], paths, relativePath);
				if (!_.isEmpty(_value2.uriParameters)) {
					var _uriParameters = result[path].uriParameters ? result[path].uriParameters : {};
					RamlResourceConverter.mapUriParameters(_value2.uriParameters, path, _uriParameters, result[path]);
				}
				return { result: result, uriParameters: _value2.uriParameters };
			} else return { result: undefined };
		}
	}, {
		key: '_export',


		// exports 1 resource definition
		value: function _export(model) {
			var attrIdMap = {};

			var attrIdSkip = ['path', 'relativePath', 'methods', 'resources', 'parameters', 'securedBy', 'annotations', 'resourceType', 'error', 'warning'];
			var ramlDef = RamlResourceConverter.createRamlDef(model, attrIdMap, attrIdSkip);
			var methodConverter = new RamlMethodConverter(this.model, this.annotationPrefix, this.def);

			if (model.hasOwnProperty('is') && model.is) {
				var isList = model.is;
				if (_.isArray(isList) && !_.isEmpty(isList)) {
					var is = [];
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

			if (model.hasOwnProperty('resourceType') && model.resourceType) {
				var resourceTypes = model.resourceType;
				if (_.isArray(resourceTypes) && !_.isEmpty(resourceTypes)) {
					var types = [];
					for (var _i = 0; _i < resourceTypes.length; _i++) {
						var _value3 = resourceTypes[_i];
						var type = void 0;
						if (_value3.value) {
							type = {};
							type[_value3.name] = _value3.value;
						} else type = _value3.name;
						types.push(type);
					}
					ramlDef.type = types.length === 1 ? types[0] : types;
				}
			}

			var parameters = model.parameters ? model.parameters : [];
			var inheritedParameters = RamlResourceConverter.exportInheritedParameters(parameters);
			var uriParameters = {};
			RamlResourceConverter.exportUriParameters(model, uriParameters, this.model, this.annotationPrefix, this.def);

			if (model.hasOwnProperty('methods') && model.methods) {
				var methodsModel = model.methods;
				if (_.isArray(methodsModel) && !_.isEmpty(methodsModel)) {
					for (var _i2 = 0; _i2 < methodsModel.length; _i2++) {
						var method = methodsModel[_i2];
						for (var property in inheritedParameters) {
							if (!inheritedParameters.hasOwnProperty(property)) continue;

							var props = inheritedParameters[property];
							if (!_.isEmpty(props)) {
								switch (property) {
									case 'bodies':
										{
											var bodies = method.bodies ? method.bodies : [];
											method.bodies = _.concat(bodies, props);
											break;
										}
									case 'formBodies':
										{
											var formBodies = method.formBodies ? method.formBodies : [];
											method.formBodies = _.concat(formBodies, props);
											break;
										}
									case 'parameters':
										{
											var _parameters = method.parameters ? method.parameters : [];
											method.parameters = _.concat(_parameters, props);
											break;
										}
									case 'headers':
										{
											var headers = method.headers ? method.headers : [];
											method.headers = _.concat(headers, props);
											break;
										}
								}
							}
						}
						RamlResourceConverter.exportUriParameters(method, uriParameters, this.model, this.annotationPrefix, this.def);
					}
					var methods = methodConverter.export(methodsModel);
					for (var id in methods) {
						if (!methods.hasOwnProperty(id)) continue;

						ramlDef[id] = methods[id];
					}
				}
			}

			if (!_.isEmpty(uriParameters)) {
				RamlResourceConverter.mapUnusedUriParameters(uriParameters, model.path, ramlDef);
				RamlResourceConverter.mapUriParameters(uriParameters, model.relativePath, {}, ramlDef);
			}

			if (model.hasOwnProperty('resources') && model.resources) {
				var resources = model.resources;
				if (_.isArray(resources) && !_.isEmpty(resources)) {
					for (var _i3 = 0; _i3 < resources.length; _i3++) {
						var _value4 = resources[_i3];
						var relativePath = _value4.relativePath;
						if (relativePath != null) ramlDef[relativePath] = this._export(_value4).result;
					}
				}
			}

			RamlAnnotationConverter.exportAnnotations(this.model, this.annotationPrefix, this.def, model, ramlDef);

			if (model.hasOwnProperty('securedBy')) {
				ramlDef.securedBy = RamlMethodConverter.exportSecurityRequirements(model);
			}

			return { result: ramlDef, uriParameters: uriParameters };
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			helper.removePropertiesFromObject(ramlDefs, ['typePropertyKind', 'fixedFacets']);
			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;

				var ramlDef = ramlDefs[id];
				var resource = this._import(ramlDef);
				result.push(resource);
				if (ramlDef.hasOwnProperty('resources') && _.isArray(ramlDef.resources)) {
					var models = this.import(ramlDef.resources);
					result = result.concat(models);
				}
			}

			return result;
		}

		// imports 1 resource definition

	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var attrIdMap = {
				'relativeUri': 'relativePath'
			};

			var attrIdSkip = ['type', 'methods', 'resources', 'relativeUriPathSegments', 'uriParameters', 'baseUriParameters', 'annotations', 'absoluteUri', 'is', 'securedBy', 'sourceMap'];
			var model = RamlResourceConverter.createResource(ramlDef, attrIdMap, attrIdSkip);
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
					} else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
						var name = Object.keys(value)[0];
						var _item = new Item();
						_item.name = name;
						_item.value = value[name];
						is.push(_item);
					}
				}
				model.is = is;
			}

			if (ramlDef.hasOwnProperty('absoluteUri')) {
				if (this.model.baseUri) {
					var baseUri = this.model.baseUri.uri;
					if (baseUri.endsWith('/')) baseUri = baseUri.substring(0, baseUri.lastIndexOf('/'));
					model.path = ramlDef.absoluteUri.replace(baseUri, '');
				} else {
					model.path = ramlDef.absoluteUri;
				}
			}

			if (ramlDef.hasOwnProperty('uriParameters') && !_.isEmpty(ramlDef.uriParameters)) {
				var parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
				var modelParameters = [];
				for (var _id in ramlDef.uriParameters) {
					if (!ramlDef.uriParameters.hasOwnProperty(_id)) continue;

					var _value5 = ramlDef.uriParameters[_id];
					var parameter = parameterConverter._import(_value5);
					if (!_value5.hasOwnProperty('type') && parameter.definition != null) delete parameter.definition.internalType;
					parameter._in = 'path';
					modelParameters.push(parameter);
				}
				model.parameters = modelParameters;
			}

			if (isRaml08Version && ramlDef.hasOwnProperty('baseUriParameters')) {
				var _parameterConverter = new ParameterConverter(this.model, this.annotationPrefix, this.def, '');
				for (var _id2 in ramlDef.baseUriParameters) {
					if (!ramlDef.baseUriParameters.hasOwnProperty(_id2)) continue;

					var parameters = _parameterConverter._import(ramlDef.baseUriParameters[_id2]);
					this.model.baseUriParameters.push(parameters);
				}
			}

			if (ramlDef.hasOwnProperty('type')) {
				var resourceTypes = [];
				if (typeof ramlDef.type === 'string') {
					var _item2 = new Item();
					_item2.name = ramlDef.type;
					resourceTypes.push(_item2);
				} else if (_typeof(ramlDef.type) === 'object') {
					for (var _name in ramlDef.type) {
						var _item3 = new Item();
						_item3.name = _name;
						_item3.value = ramlDef.type[_name];
						resourceTypes.push(_item3);
					}
				}
				model.resourceType = resourceTypes;
			}

			if (ramlDef.hasOwnProperty('methods')) {
				if (_.isArray(ramlDef.methods) && !_.isEmpty(ramlDef.methods)) {
					var methodConverter = new RamlMethodConverter(this.model, null, this.def);
					methodConverter.version = this.version;
					var methods = methodConverter.import(ramlDef.methods);
					for (var i = 0; i < methods.length; i++) {
						var method = methods[i];
						method.path = model.path;
					}
					model.methods = methods;
				}
			}

			RamlAnnotationConverter.importAnnotations(ramlDef, model, this.model);

			if (ramlDef.hasOwnProperty('securedBy')) {
				RamlResourceConverter.addInheritedSecuredBy(ramlDef, ramlDef.securedBy);
				var securedBy = RamlMethodConverter.importSecurityRequirements(ramlDef);
				model.securedBy = securedBy;
			}

			return model;
		}
	}], [{
		key: 'mapUriParameters',
		value: function mapUriParameters(source, path, uriParameters, target) {
			var relativePath = path ? path.substring(path.lastIndexOf('/')) : '';
			for (var paramName in source) {
				if (!source.hasOwnProperty(paramName)) continue;

				var param = source[paramName];
				if (!path || relativePath.includes(paramName) && !Object.keys(uriParameters).includes(paramName)) {
					uriParameters[paramName] = param;
					delete source[paramName];
				}
			}
			if (!_.isEmpty(uriParameters)) {
				if (target.uriParameters) _.merge(target.uriParameters, uriParameters);else target.uriParameters = uriParameters;
			}
		}
	}, {
		key: 'mapUnusedUriParameters',
		value: function mapUnusedUriParameters(uriParameters, absolutePath, target) {
			var unusedUriParameters = {};
			for (var paramName in uriParameters) {
				if (!uriParameters.hasOwnProperty(paramName)) continue;

				if (!absolutePath || !absolutePath.includes(paramName)) {
					unusedUriParameters[paramName] = uriParameters[paramName];
					delete uriParameters[paramName];
				}
			}
			if (!_.isEmpty(unusedUriParameters)) {
				if (target.uriParameters) _.merge(target.uriParameters, unusedUriParameters);else target.uriParameters = unusedUriParameters;
			}
		}
	}, {
		key: 'exportInheritedParameters',
		value: function exportInheritedParameters(params) {
			var bodies = [];
			var formBodies = [];
			var parameters = [];
			var headers = [];
			var inheritedParameters = {
				bodies: bodies,
				formBodies: formBodies,
				parameters: parameters,
				headers: headers
			};
			for (var i = 0; i < params.length; i++) {
				var _in = params[i]._in;
				if (_in === 'path') continue;else if (_in === 'body') {
					var body = params[i];
					inheritedParameters.bodies.push(body);
				} else if (_in === 'formData') {
					var _body = params[i];
					inheritedParameters.formBodies.push(_body);
				} else if (_in === 'query') {
					var param = params[i];
					inheritedParameters.parameters.push(param);
				} else if (_in === 'header') {
					var header = params[i];
					inheritedParameters.headers.push(header);
				}
				delete params[i];
			}

			return inheritedParameters;
		}
	}, {
		key: 'exportUriParameters',
		value: function exportUriParameters(object, uriParameters, model, annotationPrefix, ramlDef) {
			if (object.hasOwnProperty('parameters')) {
				if (_.isArray(object.parameters) && !_.isEmpty(object.parameters)) {
					var parameterConverter = new ParameterConverter(model, annotationPrefix, ramlDef, 'path');
					var parameters = parameterConverter.export(object.parameters);
					if (!_.isEmpty(parameters)) _.assign(uriParameters, parameters);
				}
			}
		}
	}, {
		key: 'reduceResources',
		value: function reduceResources(resource) {
			for (var node in resource) {
				if (!resource.hasOwnProperty(node)) continue;

				if (node.startsWith('/')) {
					resource[node] = RamlResourceConverter.reduceResources(resource[node]);
					var resourceNodes = Object.keys(resource[node]);
					if (resourceNodes.length === 1 && resourceNodes[0].startsWith('/')) {
						resource[node + resourceNodes[0]] = resource[node][resourceNodes[0]];
						delete resource[node];
					}
				}
			}

			return resource;
		}
	}, {
		key: 'createRamlDef',
		value: function createRamlDef(resource, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, resource);
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
		key: 'createResource',
		value: function createResource(ramlDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(ramlDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Resource();
			_.assign(result, object);

			return result;
		}
	}, {
		key: 'addInheritedSecuredBy',
		value: function addInheritedSecuredBy(object, securityRequirements) {
			if (object.hasOwnProperty('resources')) {
				object.resources.map(function (resource) {
					if (resource.hasOwnProperty('methods')) {
						resource.methods.map(function (method) {
							if (method.hasOwnProperty('securedBy')) {
								var securedBy = method.securedBy;
								securityRequirements.map(function (security) {
									if (!_.includes(securedBy, security)) {
										securedBy.push(security);
									}
								});
								method.securedBy = securedBy;
							} else {
								method.securedBy = securityRequirements;
							}
						});
					}
					RamlResourceConverter.addInheritedSecuredBy(resource, securityRequirements);
				});
			}
		}
	}]);

	return RamlResourceConverter;
}(Converter);

module.exports = RamlResourceConverter;