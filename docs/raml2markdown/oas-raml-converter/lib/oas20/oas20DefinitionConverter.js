'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConverterModel = require('oas-raml-converter-model');
var Definition = ConverterModel.Definition;
var Annotation = ConverterModel.Annotation;
var Converter = require('../converters/converter');
var fileHelper = require('../utils/file');
var _ = require('lodash');
var jsonHelper = require('../utils/json');
var Oas20AnnotationConverter = require('../oas20/oas20AnnotationConverter');

var Oas20DefinitionConverter = function (_Converter) {
	_inherits(Oas20DefinitionConverter, _Converter);

	function Oas20DefinitionConverter() {
		_classCallCheck(this, Oas20DefinitionConverter);

		return _possibleConstructorReturn(this, (Oas20DefinitionConverter.__proto__ || Object.getPrototypeOf(Oas20DefinitionConverter)).apply(this, arguments));
	}

	_createClass(Oas20DefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var result = {};
			for (var i = 0; i < models.length; i++) {
				var model = models[i];
				var modelName = model.name;
				this.level = 'type';
				if (!_.isEmpty(model) && model.hasOwnProperty('annotations') && model.annotations != null) {
					var annotations = model.annotations;
					var definitionNameAnnotation = annotations.filter(function (annotation) {
						return annotation.name === 'oas-definition-name';
					});
					if (!_.isEmpty(definitionNameAnnotation)) {
						var annotation = definitionNameAnnotation[0];
						var name = annotation.definition;
						result[name] = this._export(model);
					} else {
						result[modelName] = this._export(model);
					}
				} else {
					result[modelName] = this._export(model);
				}
			}

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var _this2 = this;

			var attrIdMap = {
				'_enum': 'enum',
				'_default': 'default',
				'displayName': 'title'
			};

			var attrIdSkip = ['name', 'fileReference', 'reference', 'properties', 'compositionType', 'oneOf', 'schema', 'items', 'itemsList', 'additionalProperties', 'jsonValue', 'schemaPath', 'examples', '$schema', 'id', 'fileTypes', 'annotations', 'includePath', 'expanded'];

			var oasDef = Oas20DefinitionConverter.createOasDef(model, attrIdMap, attrIdSkip);

			if (oasDef.hasOwnProperty('internalType')) {
				Oas20DefinitionConverter._convertFromInternalType(oasDef, this.level);
			}

			if (model.hasOwnProperty('example') && model.example != null) {
				var example = jsonHelper.parse(jsonHelper.stringify(model.example));

				if ((typeof example === 'undefined' ? 'undefined' : _typeof(example)) === 'object' && !_.isArray(example) && example != null) {
					oasDef['example'] = Oas20DefinitionConverter.exportExample(example);
				} else {
					oasDef['example'] = example;
				}

				if (typeof oasDef['example'] === 'number' && typeof model.example === 'string') oasDef['example'] = jsonHelper.stringify(model.example);
				if (_.isArray(oasDef['example'])) oasDef.example.map(function (e) {
					Oas20DefinitionConverter.escapeExampleAttributes(e);
				});else Oas20DefinitionConverter.escapeExampleAttributes(oasDef.example);
			}

			if (model.hasOwnProperty('examples')) {
				var examples = model.examples;
				if (_.isArray(examples) && !_.isEmpty(examples) && examples != null) {
					oasDef['example'] = jsonHelper.parse(jsonHelper.stringify(examples[0]));
				}
			}

			if (model.hasOwnProperty('additionalProperties') && model.additionalProperties != null) {
				if (_typeof(model.additionalProperties) === 'object') {
					var additionalProperties = model.additionalProperties;
					if (additionalProperties.hasOwnProperty('required') && !additionalProperties.required) delete additionalProperties.required;
					oasDef.additionalProperties = this._export(additionalProperties);
				} else {
					oasDef.additionalProperties = model.additionalProperties;
				}
			}

			if (model.hasOwnProperty('items') && model.items != null) {
				var items = model.items;
				oasDef.items = this._export(items);
			}

			if (model.hasOwnProperty('itemsList') && model.itemsList != null) {
				var itemsList = model.itemsList;
				var _items = [];
				for (var i = 0; i < itemsList.length; i++) {
					var def = itemsList[i];
					_items.push(this._export(def));
				}
				oasDef.items = _items;
			}

			if (model.hasOwnProperty('fileReference')) {
				oasDef['$ref'] = model.fileReference;
			}

			if (model.hasOwnProperty('reference') && model.reference != null) {
				var reference = model.reference;
				if (!this.def || this.def && this.def.definitions && _.keys(this.def.definitions).includes(reference)) oasDef.$ref = reference.startsWith('http://') ? reference : '#/definitions/' + reference;else oasDef.type = 'string';
			}

			if (model.hasOwnProperty('properties') && model.properties != null) {
				var properties = model.properties;
				var oasProps = {};
				for (var _i = 0; _i < properties.length; _i++) {
					var prop = properties[_i];
					this.level = 'property';
					oasProps[prop.name] = this._export(prop);
				}

				if (!_.isEmpty(oasProps)) oasDef.properties = oasProps;
				if (!_.isEmpty(model.propsRequired)) {
					oasDef.required = model.propsRequired;
				}
				delete oasDef.propsRequired;
			}

			if (model.hasOwnProperty('compositionType')) {
				var allOf = [];
				_.values(model.compositionType).map(function (value) {
					var typeModel = _this2._export(value);
					Oas20DefinitionConverter._convertToInternalType(typeModel);
					if (typeModel.hasOwnProperty('internalType') || typeModel.hasOwnProperty('$ref')) allOf.push(_this2._export(value));
				});

				if (allOf.length === 1) oasDef.type = allOf[0].type;else oasDef.allOf = allOf;
			}

			if (model.hasOwnProperty('oneOf')) {
				var oneOf = [];
				_.values(model.oneOf).map(function (val) {
					oneOf.push(_this2._export(val));
				});
				oasDef.oneOf = oneOf;
			}

			if (model.hasOwnProperty('schema') && model.schema != null) {
				var schema = model.schema;
				oasDef.schema = this._export(schema);
			}

			if (model.hasOwnProperty('annotations') && _.isArray(model.annotations) && !_.isEmpty(model.annotations)) {
				var annotationConverter = new Oas20AnnotationConverter();
				_.assign(oasDef, annotationConverter._export(model));
			}

			Oas20DefinitionConverter.checkDefaultType(oasDef);

			return oasDef;
		}
	}, {
		key: 'import',
		value: function _import(oasDefs) {
			var result = [];
			if (_.isEmpty(oasDefs)) return result;

			for (var name in oasDefs) {
				if (!oasDefs.hasOwnProperty(name)) continue;

				var value = oasDefs[name];
				var definition = this._import(value);
				definition.name = name;
				result.push(definition);
			}

			return result;
		}
	}, {
		key: '_import',
		value: function _import(oasDef) {
			var _this3 = this;

			var attrIdMap = {
				'default': '_default'
			};

			var attrIdSkip = ['enum', '$ref', 'properties', 'allOf', 'oneOf', 'schema', 'items', 'additionalProperties', 'example', 'required'];
			var model = Oas20DefinitionConverter.createDefinition(oasDef, attrIdMap, attrIdSkip);

			if (model.hasOwnProperty('type')) {
				Oas20DefinitionConverter._convertToInternalType(model);
			}

			if (oasDef.hasOwnProperty('enum') && oasDef.type !== 'boolean') {
				model._enum = oasDef.enum;
			}

			if (oasDef.hasOwnProperty('$ref')) {
				var value = oasDef['$ref'];
				var name = value.replace('#/definitions/', '');
				var existingType = this.def && _.keys(this.def.definitions).includes(name);
				if (!existingType && fileHelper.isFilePath(value)) {
					model.fileReference = value;
				} else {
					model.reference = name;
				}
			}

			if (oasDef.hasOwnProperty('items')) {
				var items = oasDef.items;
				if (_.isArray(items)) {
					var itemsList = [];
					for (var i = 0; i < items.length; i++) {
						var definition = this._import(items[i]);
						itemsList.push(definition);
					}
					model.itemsList = itemsList;
				} else {
					model.items = this._import(oasDef.items);
				}
			}

			if (oasDef.hasOwnProperty('additionalProperties')) {
				model.additionalProperties = _typeof(oasDef.additionalProperties) === 'object' ? this._import(oasDef.additionalProperties) : oasDef.additionalProperties;
			}

			if (oasDef.hasOwnProperty('required') && _.isBoolean(oasDef.required)) {
				model.required = oasDef.required;
			}

			if (oasDef.hasOwnProperty('properties')) {
				var modelProps = [];
				var required = [];

				_.entries(oasDef.properties).map(function (_ref) {
					var _ref2 = _slicedToArray(_ref, 2),
					    key = _ref2[0],
					    value = _ref2[1];

					if (value) {
						var prop = _this3._import(value);
						prop.name = key;
						if (!value.hasOwnProperty('required') || value.required) required.push(prop.name);
						modelProps.push(prop);
					}
				});

				model.properties = modelProps;
				if (oasDef.hasOwnProperty('required') && _.isArray(oasDef.required)) {
					model.propsRequired = oasDef.required;
				} else {
					model.propsRequired = required;
				}
			}

			if (oasDef.hasOwnProperty('allOf')) {
				var composition = [];

				_.values(oasDef['allOf']).map(function (val) {
					composition.push(_this3._import(val));
				});

				model.compositionType = composition;
			}

			if (oasDef.hasOwnProperty('oneOf')) {
				var oneOf = [];

				_.values(oasDef['oneOf']).map(function (val) {
					oneOf.push(_this3._import(val));
				});

				model.oneOf = oneOf;
			}

			if (oasDef.hasOwnProperty('schema')) {
				model.schema = this._import(oasDef.schema);
			}

			if (oasDef.hasOwnProperty('example') && oasDef.example) {
				if (_typeof(oasDef.example) === 'object' && !_.isArray(oasDef.example)) {
					model.example = Oas20DefinitionConverter.importExample(oasDef.example);
				} else {
					model.example = oasDef.example;
				}
			}

			var annotationConverter = new Oas20AnnotationConverter(this.model);
			var annotations = annotationConverter._import(oasDef);
			if (!_.isEmpty(annotations)) model.annotations = annotations;

			return model;
		}
	}], [{
		key: 'createOasDef',
		value: function createOasDef(definition, attrIdMap, attrIdSkip) {
			var result = {};

			_.entries(definition).map(function (_ref3) {
				var _ref4 = _slicedToArray(_ref3, 2),
				    key = _ref4[0],
				    value = _ref4[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					result[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});

			return result;
		}
	}, {
		key: 'createDefinition',
		value: function createDefinition(oasDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(oasDef).map(function (_ref5) {
				var _ref6 = _slicedToArray(_ref5, 2),
				    key = _ref6[0],
				    value = _ref6[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap.hasOwnProperty(key) ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Definition();
			_.assign(result, object);

			return result;
		}
	}, {
		key: '_convertToInternalType',
		value: function _convertToInternalType(model) {
			var hasFormat = model.hasOwnProperty('format');
			var type = model.type;
			var format = hasFormat ? model.format : null;

			if (type === 'integer' && !hasFormat) model.internalType = 'integer';
			if (type === 'number' && !hasFormat) model.internalType = 'number';
			if (type === 'integer' && format === 'int') model.internalType = 'int';
			if (type === 'integer' && format === 'int8') model.internalType = 'int8';
			if (type === 'integer' && format === 'int16') model.internalType = 'int16';
			if (type === 'integer' && format === 'int32') model.internalType = 'int32';
			if (type === 'integer' && format === 'int64') model.internalType = 'int64';
			if (type === 'number' && format === 'float') model.internalType = 'float';
			if (type === 'number' && format === 'double') model.internalType = 'double';
			if (type === 'boolean') model.internalType = 'boolean';
			if (type === 'string' && !hasFormat) model.internalType = 'string';
			if (type === 'string' && format === 'byte') model.internalType = 'byte';
			if (type === 'string' && format === 'binary') model.internalType = 'binary';
			if (type === 'string' && format === 'password') model.internalType = 'password';
			if (type === 'string' && format === 'date') model.internalType = 'dateonly';
			if (type === 'string' && format === 'date-time') model.internalType = 'datetime';
			if (type === 'object') model.internalType = 'object';
			if (type === 'array') model.internalType = 'array';

			if (model.hasOwnProperty('internalType')) {
				delete model.type;
				delete model.format;
			}
		}
	}, {
		key: '_convertFromInternalType',
		value: function _convertFromInternalType(oasDef, level) {
			if (!oasDef.hasOwnProperty('internalType')) return;
			var internalType = oasDef.internalType;

			if (internalType === 'integer') {
				oasDef.type = 'integer';
			} else if (internalType === 'number') {
				oasDef.type = 'number';
			} else if (internalType === 'int') {
				oasDef.type = 'integer';
				oasDef.format = 'int';
			} else if (internalType === 'int8') {
				oasDef.type = 'integer';
				oasDef.format = 'int8';
			} else if (internalType === 'int16') {
				oasDef.type = 'integer';
				oasDef.format = 'int16';
			} else if (internalType === 'int32') {
				oasDef.type = 'integer';
				oasDef.format = 'int32';
			} else if (internalType === 'int64') {
				oasDef.type = 'integer';
				oasDef.format = 'int64';
			} else if (internalType === 'float') {
				oasDef.type = 'number';
				oasDef.format = 'float';
			} else if (internalType === 'double') {
				oasDef.type = 'number';
				oasDef.format = 'double';
			} else if (internalType === 'boolean') {
				oasDef.type = 'boolean';
			} else if (internalType === 'string') {
				oasDef.type = 'string';
			} else if (internalType === 'byte') {
				oasDef.type = 'string';
				oasDef.format = 'byte';
			} else if (internalType === 'binary') {
				oasDef.type = 'string';
				oasDef.format = 'binary';
			} else if (internalType === 'password') {
				oasDef.type = 'string';
				oasDef.format = 'password';
			} else if (internalType === 'file') {
				oasDef.type = 'string';
			} else if (internalType === 'dateonly') {
				oasDef.type = 'string';
				oasDef.format = 'date';
			} else if (internalType === 'datetime') {
				oasDef.type = 'string';
				oasDef.format = 'date-time';
			} else if (internalType === 'timeonly') {
				oasDef.type = 'string';
			} else if (internalType === 'datetimeonly') {
				oasDef.type = 'string';
			} else if (internalType === 'null') {
				if (level === 'type') {
					oasDef.type = 'object';
				} else if (level === 'property') {
					oasDef.type = 'string';
				}
			} else if (internalType === 'timestamp') {
				oasDef.type = 'string';
			} else if (internalType === 'object') {
				oasDef.type = 'object';
			} else if (internalType === 'array') {
				oasDef.type = 'array';
			}

			delete oasDef.internalType;
		}
	}, {
		key: 'checkDefaultType',
		value: function checkDefaultType(oasDef) {
			if (!oasDef.hasOwnProperty('type')) {
				if (oasDef.hasOwnProperty('properties')) {
					oasDef.type = 'object';
				} else if (oasDef.hasOwnProperty('items')) {
					oasDef.type = 'array';
				} else if (!oasDef.hasOwnProperty('$ref') && !oasDef.hasOwnProperty('allOf') && !oasDef.hasOwnProperty('oneOf')) {
					oasDef.type = 'string';
				}
			}
		}
	}, {
		key: 'escapeExampleAttributes',
		value: function escapeExampleAttributes(example) {
			if (example != null) {
				var validTypes = ['string', 'object'];
				if (example.hasOwnProperty('type') && !validTypes.includes(_typeof(example.type))) {
					example['x-type'] = example.type;
					delete example.type;
				}
				if (example.hasOwnProperty('$ref') && !validTypes.includes(_typeof(example.type))) {
					example['x-$ref'] = example.$ref;
					delete example.$ref;
				}
			}
		}
	}, {
		key: 'importExample',
		value: function importExample(example) {
			var model = example;
			for (var id in model) {
				if (!model.hasOwnProperty(id)) continue;

				if (_typeof(model[id]) === 'object' && !_.isEmpty(model[id])) model[id] = Oas20DefinitionConverter.importExample(model[id]);
				var converter = new Oas20AnnotationConverter();
				var annotations = converter._import(model[id]);
				if (!_.isEmpty(annotations)) model[id].annotations = annotations;
			}

			return model;
		}
	}, {
		key: 'exportExample',
		value: function exportExample(example) {
			var oasDef = example;
			Oas20DefinitionConverter.escapeExampleAttributes(oasDef);
			if (oasDef.hasOwnProperty('annotations') && (_.isArray(oasDef.annotations) || _typeof(oasDef.annotations) === 'object')) {
				var annotationConverter = new Oas20AnnotationConverter();
				_.assign(oasDef, annotationConverter._export(oasDef));
				delete oasDef.annotations;
			}
			for (var id in oasDef) {
				if (!oasDef.hasOwnProperty(id)) continue;

				if (_typeof(oasDef[id]) === 'object' && !_.isEmpty(oasDef[id])) oasDef[id] = Oas20DefinitionConverter.exportExample(oasDef[id]);
			}

			return oasDef;
		}
	}]);

	return Oas20DefinitionConverter;
}(Converter);

module.exports = Oas20DefinitionConverter;