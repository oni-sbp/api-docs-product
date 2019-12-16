'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');

var ConverterModel = require('oas-raml-converter-model');
var Converter = require('../converters/converter');
var Definition = ConverterModel.Definition;
var jsonHelper = require('../utils/json');
var stringHelper = require('../utils/strings');

var Oas30AnnotationConverter = require('./oas30AnnotationConverter');

var _require = require('./oas30Types'),
    Discriminator = _require.Discriminator;

var Oas30DefinitionConverter = function (_Converter) {
	_inherits(Oas30DefinitionConverter, _Converter);

	function Oas30DefinitionConverter() {
		_classCallCheck(this, Oas30DefinitionConverter);

		return _possibleConstructorReturn(this, (Oas30DefinitionConverter.__proto__ || Object.getPrototypeOf(Oas30DefinitionConverter)).apply(this, arguments));
	}

	_createClass(Oas30DefinitionConverter, [{
		key: 'export',
		value: function _export(models) {
			var _this2 = this;

			var result = {};

			// for (let i = 0; i < models.length; i++) {
			// 	const model: Definition = models[i];
			// 	const modelName: string = model.name;
			// 	this.level = 'type';
			// 	if (!_.isEmpty(model) && model.hasOwnProperty('annotations') && model.annotations != null) {
			// 		const annotations: Annotation[] = model.annotations;
			// 		const definitionNameAnnotation: Annotation[] = annotations.filter( function(annotation) { return annotation.name === 'oas-definition-name'; });
			// 		if (!_.isEmpty(definitionNameAnnotation)) {
			// 			const annotation: Annotation = definitionNameAnnotation[0];
			// 			const name: any = annotation.definition;
			// 			result[name] = this._export(model);
			// 		} else {
			// 			result[modelName] = this._export(model);
			// 		}
			// 	} else {
			// 		result[modelName] = this._export(model);
			// 	}
			// }

			models.forEach(function (value) {
				var key = stringHelper.sanitise(value.name);
				_this2.level = 'type';
				result[key] = _this2._export(value);
			});

			return result;
		}
	}, {
		key: '_export',
		value: function _export(model) {
			var _this3 = this;

			var attrIdMap = {
				'_enum': 'enum',
				'_default': 'default',
				'displayName': 'title'
			};

			var attrIdSkip = ['name', 'fileReference', 'discriminator', 'reference', 'properties', 'compositionType', 'oneOf', 'schema', 'items', 'itemsList', 'additionalProperties', 'jsonValue', 'schemaPath', 'examples', '$schema', 'id', 'annotations', 'fileTypes', 'propsRequired', 'expanded'];

			var oasDef = Oas30DefinitionConverter.createOasDef(model, attrIdMap, attrIdSkip);

			if (oasDef.internalType != null) {
				Oas30DefinitionConverter._convertFromInternalType(oasDef, this.level);
			}

			if (model.discriminator != null) {
				oasDef.discriminator = new Discriminator(model.discriminator);
			}

			if (model.example != null) {
				var example = jsonHelper.parse(jsonHelper.stringify(model.example));

				if ((typeof example === 'undefined' ? 'undefined' : _typeof(example)) === 'object' && !_.isArray(example) && example != null) {
					oasDef.example = Oas30DefinitionConverter.exportExample(example);
				} else {
					oasDef.example = example;
				}

				if (typeof oasDef.example === 'number' && typeof model.example === 'string') {
					oasDef.example = jsonHelper.stringify(model.example);
				}
				if (Array.isArray(oasDef.example)) {
					oasDef.example.map(function (e) {
						Oas30DefinitionConverter.escapeExampleAttributes(e);
					});
				} else {
					Oas30DefinitionConverter.escapeExampleAttributes(oasDef.example);
				}
			}

			// TODO: do we change this?
			if (model.examples != null) {
				var examples = model.examples;
				if (examples != null && Array.isArray(examples) && !_.isEmpty(examples)) {
					oasDef.example = jsonHelper.parse(jsonHelper.stringify(examples[0]));
				}
			}

			if (model.additionalProperties != null) {
				if (_typeof(model.additionalProperties) === 'object') {
					var additionalProperties = model.additionalProperties;
					if (additionalProperties.required != null && !additionalProperties.required) {
						delete additionalProperties.required;
					}
					oasDef.additionalProperties = this._export(additionalProperties);
				} else if (typeof model.additionalProperties === 'boolean') {
					oasDef.additionalProperties = model.additionalProperties;
				}
			}

			if (model.items != null) {
				var items = model.items;
				oasDef.items = this._export(items);
			}

			// if (model.itemsList != null) {
			// 	const itemsList: Definition[] = model.itemsList;
			// 	const items = [];
			// 	for (let i = 0; i < itemsList.length; i++) {
			// 		const def: Definition = itemsList[i];
			// 		items.push(this._export(def));
			// 	}
			// 	oasDef.items = items;
			// }

			if (model.fileReference != null) {
				oasDef['$ref'] = model.fileReference;
			}

			if (model.reference != null) {
				var reference = model.reference;
				// if (this.def == null || (
				// 	this.def != null && Object.keys(this.def.components.schemas).includes(reference)
				// 	)) {
				oasDef.$ref = reference.startsWith('http://') ? reference : '#/components/schemas/' + reference;
				// } else {
				// 	oasDef.type = 'string';
				// }
			}

			if (model.properties != null) {
				var properties = model.properties;
				var oasProps = {};
				for (var i = 0; i < properties.length; i++) {
					var prop = properties[i];
					this.level = 'property';
					oasProps[prop.name] = this._export(prop);
				}

				if (!_.isEmpty(oasProps)) oasDef.properties = oasProps;
				if (model.propsRequired != null && !_.isEmpty(model.propsRequired)) {
					oasDef.required = model.propsRequired;
				}
				delete model.propsRequired;
			}

			if (model.compositionType != null) {
				var allOf = [];
				_.values(model.compositionType).map(function (value) {
					var typeModel = _this3._export(value);
					Oas30DefinitionConverter._convertToInternalType(typeModel);
					if (typeModel.internalType != null || typeModel.$ref != null) allOf.push(_this3._export(value));
				});

				if (allOf.length === 1) {
					oasDef.type = allOf[0].type;
				} else {
					oasDef.allOf = allOf;
				}
			}

			if (model.oneOf != null) {
				var oneOf = [];
				_.values(model.oneOf).map(function (val) {
					oneOf.push(_this3._export(val));
				});
				oasDef.oneOf = oneOf;
			}

			// if (model.schema != null) {
			// 	const schema: Definition = model.schema;
			// 	oasDef.schema = this._export(schema);
			// }

			if (model.annotations != null && _.isArray(model.annotations) && !_.isEmpty(model.annotations)) {
				var annotationConverter = new Oas30AnnotationConverter();
				_.assign(oasDef, annotationConverter._export(model));
			}

			Oas30DefinitionConverter.checkDefaultType(oasDef);

			return oasDef;
		}
	}], [{
		key: 'createOasDef',
		value: function createOasDef(definition, attrIdMap, attrIdSkip) {
			var result = {};

			_.entries(definition).map(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
				    key = _ref2[0],
				    value = _ref2[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					result[attrIdMap[key] != null ? attrIdMap[key] : key] = value;
				}
			});

			return result;
		}
	}, {
		key: 'createDefinition',
		value: function createDefinition(oasDef, attrIdMap, attrIdSkip) {
			var object = {};

			_.entries(oasDef).map(function (_ref3) {
				var _ref4 = _slicedToArray(_ref3, 2),
				    key = _ref4[0],
				    value = _ref4[1];

				if (attrIdSkip.indexOf(key) < 0 && !key.startsWith('x-')) {
					object[attrIdMap[key] != null ? attrIdMap[key] : key] = value;
				}
			});
			var result = new Definition();
			_.assign(result, object);

			return result;
		}
	}, {
		key: '_convertToInternalType',
		value: function _convertToInternalType(model) {
			var hasFormat = model.format != null;
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

			if (model.internalType != null) {
				delete model.type;
				delete model.format;
			}
		}
	}, {
		key: '_convertFromInternalType',
		value: function _convertFromInternalType(oasDef, level) {
			if (oasDef.internalType == null) return;
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
			if (oasDef.type == null) {
				if (oasDef.properties != null) {
					oasDef.type = 'object';
				} else if (oasDef.items != null) {
					oasDef.type = 'array';
				} else if (oasDef.$ref == null && !oasDef.allOf != null && oasDef.oneOf == null) {
					oasDef.type = 'string';
				}
			}
		}
	}, {
		key: 'escapeExampleAttributes',
		value: function escapeExampleAttributes(example) {
			if (example != null) {
				var validTypes = ['string', 'object'];
				if (example.type != null && !validTypes.includes(_typeof(example.type))) {
					example['x-type'] = example.type;
					delete example.type;
				}
				if (example.$ref != null && !validTypes.includes(_typeof(example.type))) {
					example['x-$ref'] = example.$ref;
					delete example.$ref;
				}
			}
		}
	}, {
		key: 'exportExample',
		value: function exportExample(example) {
			var oasDef = example;
			Oas30DefinitionConverter.escapeExampleAttributes(oasDef);
			if (oasDef.annotations != null && (_.isArray(oasDef.annotations) || _typeof(oasDef.annotations) === 'object')) {
				var annotationConverter = new Oas30AnnotationConverter();
				_.assign(oasDef, annotationConverter._export(oasDef));
				delete oasDef.annotations;
			}
			for (var id in oasDef) {
				if (!oasDef.hasOwnProperty(id)) continue;

				if (_typeof(oasDef[id]) === 'object' && !_.isEmpty(oasDef[id])) {
					oasDef[id] = Oas30DefinitionConverter.exportExample(oasDef[id]);
				}
			}

			return oasDef;
		}
	}]);

	return Oas30DefinitionConverter;
}(Converter);

module.exports = Oas30DefinitionConverter;