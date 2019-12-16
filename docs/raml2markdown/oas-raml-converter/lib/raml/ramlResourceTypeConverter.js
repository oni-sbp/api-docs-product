'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var ConverterModel = require('oas-raml-converter-model');
var ResourceType = ConverterModel.ResourceType;
var Resource = ConverterModel.Resource;
var Method = ConverterModel.Method;
var Parameter = ConverterModel.Parameter;
var Converter = require('../converters/converter');
var RamlDefinitionConverter = require('../raml/ramlDefinitionConverter');
var RamlResourceConverter = require('../raml/ramlResourceConverter');
var RamlMethodConverter = require('../raml/ramlMethodConverter');
var helper = require('../helpers/converter');
var ramlHelper = require('../helpers/raml');

var RamlResourceTypeConverter = function (_Converter) {
	_inherits(RamlResourceTypeConverter, _Converter);

	function RamlResourceTypeConverter() {
		_classCallCheck(this, RamlResourceTypeConverter);

		return _possibleConstructorReturn(this, (RamlResourceTypeConverter.__proto__ || Object.getPrototypeOf(RamlResourceTypeConverter)).apply(this, arguments));
	}

	_createClass(RamlResourceTypeConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			if (_.isEmpty(models)) return result;

			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				result[model.name] = this._export(model);
			}

			return result;
		}

		// exports 1 resource type definition

	}, {
		key: '_export',
		value: function _export(model) {
			var attrIdMap = {};

			var attrIdSkip = ['name', 'parameters', 'methods', 'resource', 'includePath'];
			var ramlDef = RamlResourceTypeConverter.createRamlDef(model, attrIdMap, attrIdSkip);
			var resourceConverter = new RamlResourceConverter(this.model);

			if (model.hasOwnProperty('resource') && !_.isEmpty(model.resource)) {
				var resourceModel = model.resource;
				var resource = resourceConverter._export(resourceModel).result;
				for (var id in resource) {
					if (!resource.hasOwnProperty(id)) continue;

					var value = resource[id];
					for (var index in value) {
						if (!value.hasOwnProperty(index)) continue;

						delete value.displayName;
					}
					ramlDef[id] = value;
				}
			}

			return ramlDef;
		}
	}, {
		key: 'import',
		value: function _import(ramlDefs) {
			var result = [];
			if (_.isEmpty(ramlDefs)) return result;

			helper.removePropertiesFromObject(ramlDefs, ['typePropertyKind', 'structuredExample']);
			for (var id in ramlDefs) {
				if (!ramlDefs.hasOwnProperty(id)) continue;

				var ramlDef = ramlDefs[id];
				var resourceType = this._import(ramlDef);
				result.push(resourceType);
			}

			return result;
		}

		// imports 1 resource type definition

	}, {
		key: '_import',
		value: function _import(ramlDef) {
			var attrIdMap = {};

			var attrIdSkip = ['description', 'displayName', 'uriParameters', 'sourceMap'];
			var validMethods = helper.getValidMethods;
			var definitionConverter = new RamlDefinitionConverter();
			var methodConverter = new RamlMethodConverter();
			var def = ramlDef[Object.keys(ramlDef)[0]];
			var model = RamlResourceTypeConverter.createResourceType(def, attrIdMap, attrIdSkip.concat(validMethods));
			if (def.hasOwnProperty('sourceMap') && def['sourceMap'].hasOwnProperty('path')) {
				model['includePath'] = def['sourceMap']['path'];
			}
			var isRaml08Version = ramlHelper.isRaml08Version(this.version);

			var resource = new Resource();
			if (!_.isEmpty(ramlDef)) {
				var methods = [];

				for (var id in def) {
					if (!def.hasOwnProperty(id) || !validMethods.includes(id)) continue;

					var value = def[id];
					var method = methodConverter._import(value);
					methods.push(method);
				}
				if (!_.isEmpty(methods)) resource.methods = methods;
				if (def.hasOwnProperty('description')) resource.description = def.description;
				if (def.hasOwnProperty('displayName')) resource.displayName = def.displayName;
				if (def.hasOwnProperty('uriParameters')) {
					if (!_.isEmpty(def.uriParameters)) {
						var modelParameters = [];
						for (var _id in def.uriParameters) {
							if (!def.uriParameters.hasOwnProperty(_id)) continue;

							var _value = def.uriParameters[_id];
							var parameter = new Parameter();
							parameter._in = 'path';
							parameter.name = isRaml08Version ? _value.name : _id;
							parameter.definition = definitionConverter._import(_value);
							if (parameter.definition != null && !parameter.definition.hasOwnProperty('required')) parameter.definition.required = true;
							modelParameters.push(parameter);
						}
						resource.parameters = modelParameters;
					}
				}
				if (!_.isEmpty(resource)) model.resource = resource;
			}

			return model;
		}
	}], [{
		key: 'createRamlDef',
		value: function createRamlDef(resourceType, attrIdMap, attrIdSkip) {
			var result = {};

			_.assign(result, resourceType);
			attrIdSkip.map(function (id) {
				delete result[id];
			});
			_.keys(attrIdMap).map(function (id) {
				result[attrIdMap[id]] = result[id];
				delete result[id];
			});

			return result;
		}
	}, {
		key: 'createResourceType',
		value: function createResourceType(ramlDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(ramlDef).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new ResourceType();
			_.assign(result, object);

			return result;
		}
	}]);

	return RamlResourceTypeConverter;
}(Converter);

module.exports = RamlResourceTypeConverter;