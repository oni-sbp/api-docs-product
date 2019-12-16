'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var Resource = ConverterModel.Resource;
var Root = ConverterModel.Root;
var Method = ConverterModel.Method;
var Definition = ConverterModel.Definition;
var Parameter = ConverterModel.Parameter;
var Item = ConverterModel.Item;
var Converter = require('../converters/converter');
var Oas20RootConverter = require('../oas20/oas20RootConverter');
var Oas20DefinitionConverter = require('../oas20/oas20DefinitionConverter');
var Oas20MethodConverter = require('../oas20/oas20MethodConverter');
var helper = require('../helpers/converter');
var stringsHelper = require('../utils/strings');
var oasHelper = require('../helpers/oas20');

var Oas20ResourceConverter = function (_Converter) {
	_inherits(Oas20ResourceConverter, _Converter);

	function Oas20ResourceConverter(model, dereferencedAPI, def) {
		_classCallCheck(this, Oas20ResourceConverter);

		var _this = _possibleConstructorReturn(this, (Oas20ResourceConverter.__proto__ || Object.getPrototypeOf(Oas20ResourceConverter)).call(this, model, '', def));

		_this.dereferencedAPI = dereferencedAPI;
		return _this;
	}

	_createClass(Oas20ResourceConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (!models || _.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var parents = Oas20ResourceConverter.getParents(model.path, models);
				if (!_.isEmpty(parents)) {
					var parent = parents[0];
					var parameters = model.parameters ? model.parameters : [];
					var modelParameters = parameters.map(function (parameter) {
						return parameter.name;
					});
					if (parent.hasOwnProperty('parameters') && parent.parameters) {
						var parentParams = parent.parameters;
						for (var j = 0; j < parentParams.length; j++) {
							var parameter = parentParams[j];
							if (!modelParameters.includes(parameter.name)) {
								parameters.push(parameter);
								model.parameters = parameters;
							}
						}
					}
				}
				var oasDef = this._export(model);
				var hasNestedResources = false;
				for (var _i = 0; _i < models.length; _i++) {
					var resource = models[_i];
					if (!hasNestedResources && resource.path && model.path) hasNestedResources = resource.path.startsWith(model.path) && resource.path !== model.path;
				}
				var hasOnlyUriParams = oasDef.hasOwnProperty('parameters') && oasDef.parameters.filter(function (param) {
					return param.in !== 'path';
				}).length === 0;
				var ignore = hasNestedResources && _.keys(oasDef).length === 1 && hasOnlyUriParams;
				if ((!(_.isEmpty(oasDef) || ignore) || model.hasOwnProperty('securedBy')) && model.path) {
					result[model.path] = oasDef;
				}
			}

			return result;
		}

		// exports 1 resource definition

	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};

			var attrIdSkip = ['path', 'relativePath', 'resourceType', 'description', 'displayName', 'methods', 'resources', 'parameters', 'is', 'securedBy', 'annotations'];
			var oasDef = Oas20ResourceConverter.createOasDef(model, attrIdMap, attrIdSkip);
			var definitionConverter = new Oas20DefinitionConverter();

			if (model.hasOwnProperty('methods') && model.methods) {
				var methodsModel = model.methods;
				if (_.isArray(methodsModel) && !_.isEmpty(methodsModel)) {
					var methodConverter = new Oas20MethodConverter(this.model, null, model.path, this.def);
					var methods = methodConverter.export(methodsModel);
					for (var id in methods) {
						if (!methods.hasOwnProperty(id)) continue;

						oasDef[id] = methods[id];
					}
				}
			}

			if (model.hasOwnProperty('parameters') && model.parameters) {
				var paramsModel = model.parameters;
				if (_.isArray(paramsModel) && !_.isEmpty(paramsModel)) {
					var parameters = [];
					for (var i = 0; i < paramsModel.length; i++) {
						var value = paramsModel[i];
						if (model.path && !model.path.includes(value.name)) continue;
						var definition = value.definition;
						var parameter = Object.assign({}, definitionConverter._export(definition));
						parameter.in = value._in;
						parameter.name = value.name;
						if (!parameter.hasOwnProperty('description') && value.hasOwnProperty('displayName')) parameter.description = value.displayName;
						parameter.required = true;
						if (!parameter.hasOwnProperty('type')) parameter.type = 'string';
						if (parameter.$ref) delete parameter.$ref;
						if (parameter.type === 'array' && !parameter.hasOwnProperty('items')) parameter.items = { type: 'string' };
						helper.removePropertiesFromObject(parameter, ['example']);
						Oas20RootConverter.exportAnnotations(value, parameter);
						parameters.push(parameter);
					}
					oasDef.parameters = parameters;
				}
			}

			Oas20RootConverter.exportAnnotations(model, oasDef);

			return oasDef;
		}
	}, {
		key: 'import',
		value: function _import(oasDefs) {
			var result = [];
			if (_.isEmpty(oasDefs)) return result;

			for (var id in oasDefs) {
				if (!oasDefs.hasOwnProperty(id)) continue;

				if (!id.startsWith('x-')) {
					this.currentPath = id;
					var oasDef = oasDefs[id];
					var resource = this._import(oasDef);
					resource.path = id;
					resource.relativePath = Oas20ResourceConverter.getRelativePath(id);
					if (resource.hasOwnProperty('methods') && resource.methods) {
						var methods = resource.methods;
						for (var i = 0; i < methods.length; i++) {
							var method = methods[i];
							method.path = resource.path;
						}
					}
					result.push(resource);
				}
			}
			var resourceAnnotations = new Resource();
			Oas20RootConverter.importAnnotations(oasDefs, resourceAnnotations, this.model);
			if (resourceAnnotations.hasOwnProperty('annotations')) this.model.resourceAnnotations = resourceAnnotations;

			return result;
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var attrIdMap = {};

			var attrIdSkip = helper.getValidMethods;
			var annotationPrefix = oasHelper.getAnnotationPrefix;
			var model = Oas20ResourceConverter.createResource(oasDef, attrIdMap, attrIdSkip, annotationPrefix);
			var definitionConverter = new Oas20DefinitionConverter();

			if (oasDef.hasOwnProperty('parameters')) {
				if (_.isArray(oasDef.parameters) && !_.isEmpty(oasDef.parameters)) {
					var parameters = [];
					var is = [];
					for (var id in oasDef.parameters) {
						if (!oasDef.parameters.hasOwnProperty(id)) continue;

						var value = oasHelper.isFilePath(oasDef.parameters[id]) && this.dereferencedAPI ? this.dereferencedAPI[this.currentPath].parameters[id] : oasDef.parameters[id];
						if (value.in === 'header') continue;
						if (value.hasOwnProperty('$ref')) {
							var dereferenced = this.dereferencedAPI[this.currentPath].parameters[id];
							if (dereferenced.in === 'path') value = dereferenced;else {
								var item = new Item();
								item.name = stringsHelper.computeResourceDisplayName(value.$ref);
								is.push(item);
							}
						}
						var parameter = new Parameter();
						parameter._in = value.in;
						parameter.name = value.name;
						Oas20RootConverter.importAnnotations(value, parameter, this.model);
						var definition = definitionConverter._import(value);
						parameter.definition = definition;
						Oas20MethodConverter.importRequired(value, parameter);
						parameters.push(parameter);
					}
					model.parameters = parameters;
					if (!_.isEmpty(is)) model.is = is;
				}
			}

			var methodConverter = new Oas20MethodConverter(this.model, this.dereferencedAPI[this.currentPath], this.currentPath, this.def);
			var methods = methodConverter.import(oasDef);
			model.methods = methods;

			Oas20RootConverter.importAnnotations(oasDef, model, this.model);

			return model;
		}
	}], [{
		key: 'getParents',
		value: function getParents(path, models) {
			var parentAbsolutePath = Oas20ResourceConverter.getParentAbsolutePath(path);
			var parents = models.filter(function (model) {
				return model.path === parentAbsolutePath;
			});
			if (!_.isEmpty(parentAbsolutePath)) parents = parents.concat(Oas20ResourceConverter.getParents(parentAbsolutePath, models));

			return parents;
		}
	}, {
		key: 'createOasDef',
		value: function createOasDef(resource, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, resource);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				var value = result[id];
				if (value !== undefined) {
					result[attrIdMap[id]] = result[id];
					delete result[id];
				}
			});

			return result;
		}
	}, {
		key: 'createResource',
		value: function createResource(oasDef, attrIdMap, attrIdSkip, annotationPrefix) {
			var object = {};

			_.entries(oasDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-') && !key.startsWith(annotationPrefix)) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Resource();
			_.assign(result, object);

			return result;
		}
	}, {
		key: 'getParentPath',
		value: function getParentPath(path) {
			if (!path) return '';
			var absoluteParent = path.substring(0, path.lastIndexOf('/'));
			return Oas20ResourceConverter.getRelativePath(absoluteParent);
		}
	}, {
		key: 'getParentAbsolutePath',
		value: function getParentAbsolutePath(path) {
			if (!path) return '';
			var parentPath = Oas20ResourceConverter.getParentPath(path);
			return path.substring(0, path.indexOf(parentPath)) + parentPath;
		}
	}, {
		key: 'getRelativePath',
		value: function getRelativePath(path) {
			return path.substring(path.lastIndexOf('/'));
		}
	}]);

	return Oas20ResourceConverter;
}(Converter);

module.exports = Oas20ResourceConverter;